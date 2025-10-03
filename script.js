document.addEventListener("DOMContentLoaded", function() {
  // Simple count up for animated stats
  const counters = document.querySelectorAll('.stat-number:not(.static)');
  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const current = +counter.innerText;
      const inc = Math.ceil(target / 36);
      if(current < target) {
        counter.innerText = Math.min(current + inc, target);
        setTimeout(updateCount, 100);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
});

document.addEventListener("DOMContentLoaded", function() {
  // Sliders and their values
  const diameterSlider = document.getElementById('diameter-slider');
  const velocitySlider = document.getElementById('velocity-slider');
  const angleSlider = document.getElementById('angle-slider');

  const diameterValue = document.getElementById('diameter-value');
  const velocityValue = document.getElementById('velocity-value');
  const angleValue = document.getElementById('angle-value');

  diameterSlider.addEventListener('input', () => { diameterValue.textContent = diameterSlider.value; });
  velocitySlider.addEventListener('input', () => { velocityValue.textContent = velocitySlider.value; });
  angleSlider.addEventListener('input', () => { angleValue.textContent = angleSlider.value; });

  // Map
  const map = L.map('map').setView([40.7128, -74.0060], 10);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors'
  }).addTo(map);

  // Impact location logic
  let impactLatLng = null;
  const impactBtn = document.getElementById('impact-btn');
  const launchBtn = document.getElementById('launch-btn');
  const hintTxt = document.getElementById('hint-txt');

  let craterLayer = null;
  let craterGlow1 = null;
  let craterGlow2 = null;

  function enableLaunch() {
    launchBtn.disabled = !impactLatLng;
    hintTxt.textContent = impactLatLng ? '' : 'Select an impact location';
  }

  impactBtn.addEventListener('click', () => {
    hintTxt.textContent = 'Click on the map to select impact location';
    map.once('click', function(e) {
      impactLatLng = e.latlng;
      L.marker(impactLatLng, {draggable: true}).addTo(map)
        .on('dragend', function(ev){
          impactLatLng = ev.target.getLatLng();
        });
      enableLaunch();
      hintTxt.textContent = '';
    });
  });

  launchBtn.addEventListener('click', () => {
    if (!impactLatLng) return;

    // ---- رسم الحفرة ----
    if (craterLayer) map.removeLayer(craterLayer);
    if (craterGlow1) map.removeLayer(craterGlow1);
    if (craterGlow2) map.removeLayer(craterGlow2);

    const asteroidDiameterM = Number(diameterSlider.value);
    const craterDiameterMeters = asteroidDiameterM * 20;
    const craterRadiusMeters = craterDiameterMeters / 2;

    craterGlow2 = L.circle(impactLatLng, {
      radius: craterRadiusMeters * 1.6,
      color: '#ffec99',
      fillColor: '#ffec99',
      fillOpacity: 0.11,
      weight: 1,
      interactive: false
    }).addTo(map);

    craterGlow1 = L.circle(impactLatLng, {
      radius: craterRadiusMeters * 1.15,
      color: '#ffc300',
      fillColor: '#ffc300',
      fillOpacity: 0.20,
      weight: 1,
      interactive: false
    }).addTo(map);

    craterLayer = L.circle(impactLatLng, {
      radius: craterRadiusMeters,
      color: '#a67c52',
      fillColor: '#47362a',
      fillOpacity: 0.45,
      weight: 4,
      dashArray: '5,10',
      interactive: false
    }).addTo(map);

    L.circle(impactLatLng, {
      radius: craterRadiusMeters * 0.42,
      color: '#222',
      fillColor: '#111',
      fillOpacity: 0.45,
      weight: 1,
      interactive: false
    }).addTo(map);

    // Flash effect
    let explosion = document.createElement('div');
    explosion.className = 'explosion';
    document.body.appendChild(explosion);
    let pt = map.latLngToContainerPoint(impactLatLng);
    const mapRect = map._container.getBoundingClientRect();
    explosion.style.left = (mapRect.left + pt.x) + 'px';
    explosion.style.top = (mapRect.top + pt.y) + 'px';
    setTimeout(() => explosion.remove(), 850);

    map.setView(impactLatLng, 13);
    impactBtn.style.display = 'none';

    // ---- حساب الإحصائيات ----
    const diameter = Number(diameterSlider.value); // متر
    const velocity = Number(velocitySlider.value); // كم/ث
    const angle = Number(angleSlider.value); // درجة

    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * 7800; // كغ (كثافة الحديد)
    const velocityMS = velocity * 1000;
    const impactEnergyJ = 0.5 * mass * Math.pow(velocityMS, 2);
    const impactEnergyMt = impactEnergyJ / (4.184e15);

    const craterDiameterKm = (diameter * 20) / 1000;
    const severeDamageKm = craterDiameterKm * 2.5;
    let estimatedCasualties = Math.round(2000 * craterDiameterKm * velocity / 10);

    const resultsPanel = document.getElementById('results-panel');
    const resultsContent = document.getElementById('results-content');
    resultsPanel.style.display = 'block';
    resultsContent.innerHTML = `
      <table>
        <tr><td><b>Crater diameter:</b></td><td>${craterDiameterKm.toFixed(2)} km</td></tr>
        <tr><td><b>Impact energy:</b></td><td>${impactEnergyMt.toLocaleString(undefined, {maximumFractionDigits: 1})} megatons TNT</td></tr>
        <tr><td><b>Severe damage radius:</b></td><td>${severeDamageKm.toFixed(2)} km</td></tr>
        <tr><td><b>Estimated casualties:</b></td><td>${estimatedCasualties.toLocaleString()}</td></tr>
      </table>
    `;
  });

  enableLaunch();
});

// // Main logic for sliders, button states, and Leaflet map

// // Asteroid Launcher crater effect on Leaflet map (like neal.fun)

// document.addEventListener("DOMContentLoaded", function() {
//   // Sliders and their values
//   const diameterSlider = document.getElementById('diameter-slider');
//   const velocitySlider = document.getElementById('velocity-slider');
//   const angleSlider = document.getElementById('angle-slider');

//   const diameterValue = document.getElementById('diameter-value');
//   const velocityValue = document.getElementById('velocity-value');
//   const angleValue = document.getElementById('angle-value');

//   diameterSlider.addEventListener('input', () => { diameterValue.textContent = diameterSlider.value; });
//   velocitySlider.addEventListener('input', () => { velocityValue.textContent = velocitySlider.value; });
//   angleSlider.addEventListener('input', () => { angleValue.textContent = angleSlider.value; });

//   // Map
//   const map = L.map('map', {
//     zoomControl: true,
//     attributionControl: true,
//     minZoom: 5,
//     maxZoom: 18,
//     zoomSnap: 0.25,
//     boxZoom: false,
//     doubleClickZoom: true
//   }).setView([40.7128, -74.0060], 10);

//   // Apple Maps tiles for similar style (or fallback to OSM if not working)
//   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: 'Map data © OpenStreetMap contributors'
//   }).addTo(map);

//   // Impact location logic
//   let impactLatLng = null;
//   const impactBtn = document.getElementById('impact-btn');
//   const launchBtn = document.getElementById('launch-btn');
//   const hintTxt = document.getElementById('hint-txt');

//   // Store crater layers globally to remove them on each launch
//   let craterLayer = null;
//   let craterGlow1 = null;
//   let craterGlow2 = null;

//   function enableLaunch() {
//     launchBtn.disabled = !impactLatLng;
//     hintTxt.textContent = impactLatLng ? '' : 'Select an impact location';
//   }

//   impactBtn.addEventListener('click', () => {
//     hintTxt.textContent = 'Click on the map to select impact location';
//     map.once('click', function(e) {
//       impactLatLng = e.latlng;
//       L.marker(impactLatLng, {draggable: true}).addTo(map)
//         .on('dragend', function(ev){
//           impactLatLng = ev.target.getLatLng();
//         });
//       enableLaunch();
//       hintTxt.textContent = '';
//     });
//   });

//   launchBtn.addEventListener('click', () => {
//     if (!impactLatLng) return;

//     // Remove old craters if present
//     if (craterLayer) map.removeLayer(craterLayer);
//     if (craterGlow1) map.removeLayer(craterGlow1);
//     if (craterGlow2) map.removeLayer(craterGlow2);

//     // Calculate crater diameter (roughly: 20x asteroid diameter in meters, but tweak as needed)
//     const asteroidDiameterM = Number(diameterSlider.value);
//     const craterDiameterMeters = asteroidDiameterM * 20;
//     const craterRadiusMeters = craterDiameterMeters / 2;

//     // Outer glow (faint, for effect)
//     craterGlow2 = L.circle(impactLatLng, {
//       radius: craterRadiusMeters * 1.6,
//       color: '#ffec99',
//       fillColor: '#ffec99',
//       fillOpacity: 0.11,
//       weight: 1,
//       interactive: false
//     }).addTo(map);

//     // Middle glow (yellow/orange, for effect)
//     craterGlow1 = L.circle(impactLatLng, {
//       radius: craterRadiusMeters * 1.15,
//       color: '#ffc300',
//       fillColor: '#ffc300',
//       fillOpacity: 0.20,
//       weight: 1,
//       interactive: false
//     }).addTo(map);

//     // Main crater (dark)
//     craterLayer = L.circle(impactLatLng, {
//       radius: craterRadiusMeters,
//       color: '#a67c52',
//       fillColor: '#47362a',
//       fillOpacity: 0.45,
//       weight: 4,
//       dashArray: '5,10',
//       interactive: false
//     }).addTo(map);

//     // Center (very dark)
//     L.circle(impactLatLng, {
//       radius: craterRadiusMeters * 0.42,
//       color: '#222',
//       fillColor: '#111',
//       fillOpacity: 0.45,
//       weight: 1,
//       interactive: false
//     }).addTo(map);

//     // Optional: quick explosion flash
//     let explosion = document.createElement('div');
//     explosion.className = 'explosion';
//     document.body.appendChild(explosion);
//     let pt = map.latLngToContainerPoint(impactLatLng);
//     const mapRect = map._container.getBoundingClientRect();
//     explosion.style.left = (mapRect.left + pt.x) + 'px';
//     explosion.style.top = (mapRect.top + pt.y) + 'px';
//     setTimeout(() => explosion.remove(), 850);

//     // Zoom in to the crater
//     map.setView(impactLatLng, 13);

//     // Hide impact location button
//     impactBtn.style.display = 'none';
//   });

//   // Initial state
//   enableLaunch();
// });



// launchBtn.addEventListener('click', () => {
//   if (!impactLatLng) return;

//   // ... رسم الحفرة كما في الكود السابق ...

//   // حسابات تقريبية للإحصاءيات
//   const diameter = Number(diameterSlider.value); // متر
//   const velocity = Number(velocitySlider.value); // كم/ث
//   const angle = Number(angleSlider.value); // درجة

//   // طاقة التصادم (تقريبية جدا) = 0.5 * m * v^2
//   // كثافة الحديد ~ 7800 كغ/م3
//   const radius = diameter / 2;
//   const volume = (4/3) * Math.PI * Math.pow(radius, 3);
//   const mass = volume * 7800;
//   const velocityMS = velocity * 1000; // حول من كم/ث إلى م/ث
//   const impactEnergyJ = 0.5 * mass * Math.pow(velocityMS, 2);
//   const impactEnergyMt = impactEnergyJ / (4.184e15); // ميغاطن تي إن تي

//   // تقدير قطر الحفرة بالكيلومتر
//   const craterDiameterKm = (diameter * 20) / 1000;

//   // مدى الدمار (تقريبي)
//   const severeDamageKm = craterDiameterKm * 2.5;

//   // خسائر تقريبية (أرقام عشوائية هنا، ويمكنك تطويرها)
//   let estimatedCasualties = Math.round(2000 * craterDiameterKm * velocity / 10);

//   // عرض النتائج
//   const resultsPanel = document.getElementById('results-panel');
//   const resultsContent = document.getElementById('results-content');
//   resultsPanel.style.display = 'block';
//   resultsContent.innerHTML = `
//     <table>
//       <tr><td><b>Crater diameter:</b></td><td>${craterDiameterKm.toFixed(2)} km</td></tr>
//       <tr><td><b>Impact energy:</b></td><td>${impactEnergyMt.toLocaleString(undefined, {maximumFractionDigits: 1})} megatons TNT</td></tr>
//       <tr><td><b>Severe damage radius:</b></td><td>${severeDamageKm.toFixed(2)} km</td></tr>
//       <tr><td><b>Estimated casualties:</b></td><td>${estimatedCasualties.toLocaleString()}</td></tr>
//     </table>
//   `;
// });