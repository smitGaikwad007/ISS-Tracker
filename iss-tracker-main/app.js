/* app.js */

// DOM elements
const latSpan = document.querySelector('.lat') // Latitude
const lonSpan = document.querySelector('.lon') // Longitude
const altSpan = document.querySelector('.alt') // Altitude
const spdSpan = document.querySelector('.spd') // Orbital speed
const issInfo = document.querySelectorAll('span')
const mapBehaviorButtons = document.querySelectorAll('.map-behavior > * button')
const mapStyleButtons = document.querySelectorAll('.map-style > * button')
const unitButtons = document.querySelectorAll('.unit > * button')

// Global variables
const issData = 'https://api.wheretheiss.at/v1/satellites/25544'
const initialTiles = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
const attribution = 'Map data &copy; Google'
const iconOptions = {
  iconUrl: './assets/icons/iss_dark.png',
  iconSize: [100, 70],
  iconAnchor: [50, 35],
}

let initialLoad = true
let isCentered = false
let unit = 'miles'
let alt, lat, lon, map, marker, spd, tiles

// Functions
const createMap = () => {
  // Creates a map with tiles from Google and marker with ISS image

  // Tiles
  map = L.map('map').setView([0, 0], 1)
  tiles = L.tileLayer(initialTiles, { attribution })
  tiles.addTo(map)

  // Marker
  const issIcon = L.icon({ ...iconOptions })
  marker = L.marker([0, 0], { icon: issIcon }).addTo(map)
}

const fetchIss = async () => {
  // Fetches ISS data

  try {
    const response = await fetch(issData)
    const data = await response.json()
    return data
  } catch (err) {
    console.error(err)
  }
}

const refreshInfo = async () => {
  // Updates the global variables with new data

  try {
    const { altitude, latitude, longitude, velocity } = await fetchIss()

    lat = latitude
    lon = longitude
    alt = altitude
    spd = velocity

    marker.setLatLng([lat, lon]) // Sets marker coordinates
    checkMap()
    refreshDom()
    checkInitialLoad()
  } catch (err) {
    console.error(err)
    issInfo.forEach((topic) => (topic.textContent = 'not available'))
  }
}

const refreshDom = () => {
  // Updates the DOM elements

  // Altitude is given in KILOMETERS
  // Velocity is given in KILOMETERS PER HOUR

  // Conversion factors (to be multiplied by)
  const KILOMETER_TO_MILE = 0.621371
  const HOUR_TO_SECOND = 0.000277778

  latSpan.textContent = `${lat.toFixed(2)}°`
  lonSpan.textContent = `${lon.toFixed(2)}°`

  // prettier-ignore
  switch (unit) {
    case 'miles':
    default:
      altSpan.textContent = (alt * KILOMETER_TO_MILE).toFixed(2) + ' miles'
      spdSpan.textContent = (spd * KILOMETER_TO_MILE * HOUR_TO_SECOND).toFixed(2) + ' miles/s'
      break

    case 'kilometers':
      altSpan.textContent = alt.toFixed(2) + ' km'
      spdSpan.textContent = (spd * HOUR_TO_SECOND).toFixed(2) + ' km/s'
      break
  }
}

const checkMap = () => {
  // Sets map view to always match the ISS location if 'Center ISS' is selected

  if (!isCentered) return

  map.setView([lat, lon])
}

const checkInitialLoad = () => {
  // Sets map view to match the ISS location when the app starts

  if (!initialLoad) return

  map.setView([lat, lon], 3)
  initialLoad = false
}

const changeMapBehavior = (e) => {
  // Changes the behavior of the map, whether it is free to move or centered on the ISS position

  const button = e.target
  const { mapBehavior } = button.dataset

  switch (mapBehavior) {
    case 'free':
    default:
      isCentered = false
      break

    case 'centered':
      map.setView([lat, lon])
      isCentered = true
      break
  }

  // Highlights the active button
  mapBehaviorButtons.forEach((button) => button.classList.remove('active'))
  button.classList.add('active')
}

const changeMapStyle = (e) => {
  // Changes the map tiles and marker based in the selected style

  const button = e.target
  const { mapStyle } = button.dataset
  const iconTheme = mapStyle === 'm' || mapStyle === 'p' ? 'dark' : 'light'

  // Layer cleanup (map and marker)
  tiles.remove()
  marker.remove()

  // New tiles and marker
  const tileUrl = `https://mt1.google.com/vt/lyrs=${mapStyle}&x={x}&y={y}&z={z}`
  const issIcon = L.icon({
    ...iconOptions,
    iconUrl: `./assets/icons/iss_${iconTheme}.png`,
  })

  tiles = L.tileLayer(tileUrl, { attribution }).addTo(map)
  marker = L.marker([lat, lon], { icon: issIcon }).addTo(map)

  // Highlights the active button
  mapStyleButtons.forEach((button) => button.classList.remove('active'))
  button.classList.add('active')
}

const changeUnit = (e) => {
  // Changes between miles and kilometers

  const button = e.target
  unit = button.dataset.unit

  refreshDom()

  // Highlights the active button
  unitButtons.forEach((button) => button.classList.remove('active'))
  button.classList.add('active')
}

const init = () => {
  // Initiates the application

  createMap()
  setInterval(refreshInfo, 1000) // Updates data every second
}

// Event listeners
mapBehaviorButtons.forEach((button) =>
  button.addEventListener('click', (e) => changeMapBehavior(e))
)

mapStyleButtons.forEach((button) =>
  button.addEventListener('click', (e) => changeMapStyle(e))
)

unitButtons.forEach((button) => button.addEventListener('click', (e) => changeUnit(e)))

document.addEventListener('DOMContentLoaded', init)
