import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Truck, Home, Loader2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getNGOs, getVolunteers, getDonations } from '@/app/services/api';

// Fix for default leaflet icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon Creators using Lucide
const createCustomIcon = (IconComponent: any, color: string) => {
  return L.divIcon({
    html: renderToStaticMarkup(
      <div style={{ color }} className="bg-white p-1.5 rounded-full shadow-lg border-2 border-current">
        <IconComponent size={18} />
      </div>
    ),
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const donorIcon = createCustomIcon(MapPin, '#D8A569');
const ngoIcon = createCustomIcon(Home, '#7CB69F');
const volunteerIcon = createCustomIcon(Truck, '#9B8BC5');

const MOCK_NGOS = [
  { id: 'm-ngo-1', name: 'Robin Hood Army', location: { latitude: 12.9786, longitude: 77.5906 }, capacity: 500 },
  { id: 'm-ngo-2', name: 'Feeding India', location: { latitude: 12.9516, longitude: 77.6246 }, capacity: 300 },
  { id: 'm-ngo-3', name: 'Akshaya Patra', location: { latitude: 12.9916, longitude: 77.5546 }, capacity: 1000 },
  { id: 'm-ngo-4', name: 'Bangalore Food Bank', location: { latitude: 12.9216, longitude: 77.5846 }, capacity: 400 },
  { id: 'm-ngo-5', name: 'Hasiru Dala', location: { latitude: 12.9316, longitude: 77.6146 }, capacity: 200 },
  { id: 'm-ngo-6', name: 'Goonj', location: { latitude: 12.9616, longitude: 77.6446 }, capacity: 600 },
  { id: 'm-ngo-7', name: 'GiveIndia', location: { latitude: 12.9816, longitude: 77.5646 }, capacity: 350 },
  { id: 'm-ngo-8', name: 'North Bangalore Relief', location: { latitude: 13.055, longitude: 77.615 }, capacity: 450 },
];

const MOCK_DONATIONS = [
  { id: 'm-don-1', food_type: 'Biryani Surplus', quantity: 50, location: { latitude: 12.9346, longitude: 77.6101 }, location_name: 'Koramangala', status: 'PENDING' },
  { id: 'm-don-2', food_type: 'Meals', quantity: 30, location: { latitude: 12.9756, longitude: 77.6001 }, location_name: 'MG Road', status: 'CLAIMED' },
  { id: 'm-don-3', food_type: 'Sandwiches', quantity: 100, location: { latitude: 12.9116, longitude: 77.6346 }, location_name: 'HSR Layout', status: 'PENDING' },
  { id: 'm-don-4', food_type: 'Bread & Fruit', quantity: 20, location: { latitude: 12.9816, longitude: 77.5446 }, location_name: 'Rajajinagar', status: 'COMPLETED' },
  { id: 'm-don-5', food_type: 'Curry & Rice', quantity: 40, location: { latitude: 12.9416, longitude: 77.5646 }, location_name: 'Jayanagar', status: 'PENDING' },
  { id: 'm-don-6', food_type: 'Packed Lunches', quantity: 80, location: { latitude: 13.0016, longitude: 77.5846 }, location_name: 'Malleshwaram', status: 'CLAIMED' },
  { id: 'm-don-7', food_type: 'Dinner Buffet', quantity: 120, location: { latitude: 12.9516, longitude: 77.6946 }, location_name: 'Whitefield', status: 'PENDING' },
  { id: 'm-don-8', food_type: 'Corporate Buffet', quantity: 150, location: { latitude: 13.045, longitude: 77.620 }, location_name: 'Manyata Tech Park', status: 'PENDING' },
];

const MOCK_VOLUNTEERS = [
  { id: 'm-vol-1', name: 'Rahul K.', current_location: { latitude: 12.9416, longitude: 77.6201 }, status: 'EN_ROUTE' },
  { id: 'm-vol-2', name: 'Priya S.', current_location: { latitude: 12.9656, longitude: 77.5901 }, status: 'IDLE' },
  { id: 'm-vol-3', name: 'Amit M.', current_location: { latitude: 12.9216, longitude: 77.6446 }, status: 'DELIVERING' },
  { id: 'm-vol-4', name: 'Sneha R.', current_location: { latitude: 12.9856, longitude: 77.5546 }, status: 'EN_ROUTE' },
  { id: 'm-vol-5', name: 'Vikram D.', current_location: { latitude: 12.9316, longitude: 77.5746 }, status: 'IDLE' },
  { id: 'm-vol-6', name: 'Anita B.', current_location: { latitude: 12.9916, longitude: 77.6046 }, status: 'DELIVERING' },
  { id: 'm-vol-7', name: 'Karthik P.', current_location: { latitude: 12.9616, longitude: 77.6646 }, status: 'EN_ROUTE' },
  { id: 'm-vol-8', name: 'Suresh M.', current_location: { latitude: 13.050, longitude: 77.618 }, status: 'EN_ROUTE' },
];

interface OperationsMapProps {
  isFullscreen?: boolean;
}

export function OperationsMap({ isFullscreen }: OperationsMapProps) {
  const [data, setData] = useState<{ ngos: any[], volunteers: any[], donations: any[] }>({
    ngos: [],
    volunteers: [],
    donations: []
  });
  const [loading, setLoading] = useState(true);
  const [blink, setBlink] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 1 ? 0 : p + 0.005)); // Move slowly
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 500); // Blink every 500ms
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const [ngos, volunteers, donations] = await Promise.all([
          getNGOs(),
          getVolunteers(),
          getDonations()
        ]);
        setData({ 
          ngos: [...MOCK_NGOS, ...ngos], 
          volunteers: [...MOCK_VOLUNTEERS, ...volunteers], 
          donations: [...MOCK_DONATIONS, ...donations] 
        });
      } catch (error) {
        console.error("Failed to fetch map data", error);
        setData({ ngos: MOCK_NGOS, volunteers: MOCK_VOLUNTEERS, donations: MOCK_DONATIONS });
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
    const interval = setInterval(fetchMapData, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/10">
        <Loader2 className="animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Initializing Geographic Stream...</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${isFullscreen ? 'h-full' : 'h-[600px] rounded-xl overflow-hidden border border-border shadow-2xl'}`}>
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* NGOs */}
        {data.ngos.filter(n => n.location?.latitude && n.location?.longitude).map((ngo) => (
          <React.Fragment key={ngo.id}>
            <Marker
              position={[ngo.location.latitude, ngo.location.longitude]}
              icon={ngoIcon}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <h3 className="font-bold text-sm mb-1">{ngo.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase">Capacity: {ngo.capacity} meals</p>
                  <div className="mt-2 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full inline-block">NGO Partner</div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[ngo.location.latitude, ngo.location.longitude]}
              radius={1070}
              pathOptions={{ fillColor: '#7CB69F', color: '#7CB69F', weight: 2, fillOpacity: 0.6 }}
            />
          </React.Fragment>
        ))}

        {/* Volunteers */}
        {data.volunteers.filter(v => v.current_location?.latitude && v.current_location?.longitude).map((v, index) => {
          const mockRoutes = [
            [[12.9786, 77.5906], [12.9756, 77.6001]], // NGO 1 to Don 2 (Closest)
            [[12.9516, 77.6246], [12.9346, 77.6101]], // NGO 2 to Don 1 (Closest)
            [[12.9916, 77.5546], [12.9816, 77.5446]], // NGO 3 to Don 4 (Closest)
            [[12.9216, 77.5846], [12.9416, 77.5646]], // NGO 4 to Don 5 (Closest)
            [[12.9316, 77.6146], [12.9346, 77.6101]], // NGO 5 to Don 1 (Closest)
            [[12.9616, 77.6446], [12.9756, 77.6001]], // NGO 6 to Don 2 (Closest)
            [[12.9816, 77.5646], [12.9816, 77.5446]], // NGO 7 to Don 4 (Closest)
            [[13.055, 77.615], [13.045, 77.620]], // NGO 8 to Don 8 (Manyata)
          ];
          
          const route = (mockRoutes[index % mockRoutes.length] || [[12.9716, 77.5946], [12.9716, 77.5946]]) as [number, number][];
          
          const p1 = route[0];
          const p2 = route[1];
          const currentPos: [number, number] = [
            p1[0] + (p2[0] - p1[0]) * progress,
            p1[1] + (p2[1] - p1[1]) * progress
          ];

          return (
            <React.Fragment key={v.id}>
              <Marker
                position={currentPos}
                icon={volunteerIcon}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-sm mb-1">{v.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase">Status: {v.status}</p>
                  </div>
                </Popup>
              </Marker>
              <Polyline 
                positions={route}
                pathOptions={{ color: '#9B8BC5', weight: 4, opacity: 0.7 }}
              />
            </React.Fragment>
          );
        })}

        {/* Donations */}
        {data.donations.filter(d => d.location?.latitude && d.location?.longitude).map((d) => (
          <React.Fragment key={d.id}>
            <Marker
              position={[d.location.latitude, d.location.longitude]}
              icon={donorIcon}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-sm mb-1">{d.food_type}</h3>
                  <p className="text-primary font-black text-sm">{d.quantity} servings</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{d.location_name}</p>
                  <div className="mt-2 text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full inline-block uppercase font-bold">
                    {d.status}
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[d.location.latitude, d.location.longitude]}
              radius={855}
              pathOptions={{ 
                fillColor: '#FF0000', 
                color: '#FF0000', 
                weight: 2, 
                fillOpacity: blink ? 0.7 : 0.2 
              }}
            />
          </React.Fragment>
        ))}

      </MapContainer>

      {/* Map UI Overlay */}
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
        <div className="bg-background/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl min-w-[200px]">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Live Network</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#D8A569]" />
                <span className="text-xs font-medium">Donations</span>
              </div>
              <span className="text-xs font-bold">{data.donations.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#7CB69F]" />
                <span className="text-xs font-medium">NGO Partners</span>
              </div>
              <span className="text-xs font-bold">{data.ngos.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#9B8BC5]" />
                <span className="text-xs font-medium">Active Fleet</span>
              </div>
              <span className="text-xs font-bold">{data.volunteers.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
