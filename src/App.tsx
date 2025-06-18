import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix leaflet's default icon paths when bundling with Vite
// @ts-expect-error -- leaflet typings don't include this property
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
});

type Location = { date: string; lat: number; lng: number };

const locationHistory: Record<string, Location[]> = {
  Alice: [
    { date: '2025-01-01', lat: 40.7128, lng: -74.006 },
    { date: '2025-01-02', lat: 40.7138, lng: -74.001 },
  ],
  Bob: [
    { date: '2025-01-01', lat: 34.0522, lng: -118.2437 },
    { date: '2025-01-03', lat: 34.0522, lng: -118.24 },
  ],
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState('2025-01-01');
  const [activeUsers, setActiveUsers] = useState<string[]>(['Alice', 'Bob']);

  const toggleUser = (user: string) => {
    setActiveUsers((current) =>
      current.includes(user)
        ? current.filter((u) => u !== user)
        : [...current, user]
    );
  };

  const markers: { user: string; loc: Location }[] = [];
  for (const user of activeUsers) {
    for (const loc of locationHistory[user] ?? []) {
      if (loc.date === selectedDate) {
        markers.push({ user, loc });
      }
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Settings</h2>
        <div className="settings-block">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="settings-block">
          <div>Users</div>
          {Object.keys(locationHistory).map((user) => (
            <label key={user}>
              <input
                type="checkbox"
                checked={activeUsers.includes(user)}
                onChange={() => toggleUser(user)}
              />{' '}
              {user}
            </label>
          ))}
        </div>
      </aside>
      <main className="map">
        <MapContainer
          center={[40.7128, -74.006]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {markers.map(({ user, loc }, idx) => (
            <Marker key={idx} position={[loc.lat, loc.lng]}>
              <Popup>
                {user} at {loc.date}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}
