import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const INITIAL_CENTER = [17.385044, 78.486671]; // Default map center (Hyderabad)

const vehicleIcon = L.divIcon({
    className: 'text-2xl',
    html: '<span class="text-red-600">🚗</span>',
    iconSize: [24, 24],
});

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    return Math.sqrt(dLat * dLat + dLon * dLon) * 111.32; // Simplified planar approximation
}

function calculateSpeedKmH(currentIndex, routeData) {
    if (currentIndex === 0 || routeData.length <= 1) return '0.00';

    const currPoint = routeData[currentIndex];
    const prevPoint = routeData[currentIndex - 1];

    if (!prevPoint || !currPoint) return '0.00';

    const distanceKm = calculateDistanceKm(
        prevPoint.lat, prevPoint.lng,
        currPoint.lat, currPoint.lng
    );

    const timeDeltaMs = new Date(currPoint.timestamp).getTime() - new Date(prevPoint.timestamp).getTime();
    const timeDeltaHours = timeDeltaMs / (1000 * 60 * 60); // Convert ms to hours

    if (timeDeltaHours <= 0) return 'N/A';

    const speed = distanceKm / timeDeltaHours; // Speed in km/h
    return speed.toFixed(2);
}

function VehicleMap() {
    const [routeData, setRouteData] = useState([]); // State to store route data
    const [currentIndex, setCurrentIndex] = useState(0); // State for current vehicle position
    const [isPlaying, setIsPlaying] = useState(false); // State for play/pause
    const intervalRef = useRef(null); // Ref to store interval ID

    // Fetch route data from dummy-route.json
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/dummy-route.json'); // Fetch from public folder
                const data = await response.json();

                // Transform data into [lat, lng] format
                setRouteData(data.map(point => ({
                    lat: point.latitude,
                    lng: point.longitude,
                    timestamp: point.timestamp,
                })));
                console.log('VehicleMap component rendered');
            } catch (error) {
                console.error('Error loading route data:', error);
            }
        };

        loadData();
    }, []); // Empty dependency array ensures this runs only once

    // Extract coordinates for the full route polyline
    const fullRouteCoords = routeData.map(point => [point.lat, point.lng]);

    useEffect(() => {
        if (isPlaying && routeData.length > 0 && currentIndex < routeData.length - 1) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex(prevIndex => prevIndex + 1);
            }, 2000); // Update every 2 seconds
        }

        return () => clearInterval(intervalRef.current); // Cleanup interval on unmount or state change
    }, [isPlaying, currentIndex, routeData]);

    const currentPosition = routeData[currentIndex] || { lat: 0, lng: 0, timestamp: null };

    // Debugging logs
    console.log('Current Position:', currentPosition);
    console.log('Route Data:', routeData);

    return (
        <div className="h-screen w-full">
            <MapContainer
                center={INITIAL_CENTER}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: '70vh', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Draw the full route */}
                {routeData.length > 0 && (
                    <Polyline
                        pathOptions={{ color: 'gray', weight: 3, opacity: 0.5 }}
                        positions={fullRouteCoords}
                    />
                )}
                {/* Vehicle Marker */}
                {currentPosition && (
                    <Marker
                        position={[currentPosition.lat, currentPosition.lng]}
                        icon={vehicleIcon}
                    />
                )}
            </MapContainer>
            {/* Play/Pause and Reset Controls */}
            <div className="absolute top-4 right-4 bg-white p-4 rounded-lg w-full max-w-xs md:max-w-sm shadow-xl z-[1000]" style={{ zIndex: 1000 }}>
                <h2 className="text-lg font-bold mb-3">Vehicle Status</h2>
                <div className="space-y-1 text-sm">
                    <p>Coordinate: <span className="font-mono text-blue-600">{currentPosition.lat?.toFixed(6)}, {currentPosition.lng?.toFixed(6)}</span></p>
                    <p>Timestamp: 
                        <span className=" font-medium text-gray-700">
                            {currentPosition.timestamp ? new Date(currentPosition.timestamp).toLocaleTimeString() : 'N/A'}
                        </span>
                    </p>
                    <p>Speed: <span className="font-medium text-gray-700">{calculateSpeedKmH(currentIndex, routeData)} km/h</span></p>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex-1 px-4 py-2 text-white font-semibold rounded-lg transition"
                        style={{ backgroundColor: isPlaying ? '#ef4444' : '#22c55e', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                    >
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                        onClick={() => {
                            setIsPlaying(false);
                            setCurrentIndex(0);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
                        style={{ backgroundColor: '#e5e7eb', color: '#1f2937', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Ensure state stability */}
            {console.log('isPlaying:', isPlaying)}
            {console.log('currentIndex:', currentIndex)}
            {console.log('routeData:', routeData)}
        </div>
    );
}

export default VehicleMap;