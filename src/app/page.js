"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Map, { Marker } from 'react-map-gl';
import Supercluster from 'supercluster';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: 51.1657,
    longitude: 10.4515,
    zoom: 5,
  });
  const [clusters, setClusters] = useState([]);
  const superclusterRef = useRef(new Supercluster({ radius: 50, maxZoom: 16 }));

  useEffect(() => {
    fetch('https://opensheet.vercel.app/1HueWQVuM5LEzGmbDJj5bipF1Jqe-7bY8gLhQcz1F9Qg/immobilien')
      .then((response) => response.json())
      .then((data) => {
        const formattedListings = data
          .map((item) => ({
            type: "Feature",
            properties: {
              cluster: false,
              id: item.PK_numerical,
              title: item.Beschreibung,
              address: item.Adresse,
              description: item.Beschreibung,
            },
            geometry: {
              type: "Point",
              coordinates: [parseFloat(item.Longitude), parseFloat(item.Latitude)],
            },
          }))
          .filter((listing) =>
            !isNaN(listing.geometry.coordinates[0]) &&
            !isNaN(listing.geometry.coordinates[1])
          );

        console.log("Fetched Listings:", formattedListings);
        superclusterRef.current.load(formattedListings);
        setListings(formattedListings);
      })
      .catch((error) => console.error('Error fetching listings:', error));
  }, []);

  useEffect(() => {
    if (listings.length > 0) {
      try {
        const bounds = [
          [viewport.longitude - 5, viewport.latitude - 5],
          [viewport.longitude + 5, viewport.latitude + 5],
        ];
        const generatedClusters = superclusterRef.current.getClusters(bounds.flat(), Math.floor(viewport.zoom));
        console.log("Generated Clusters:", generatedClusters);
        setClusters(generatedClusters);
      } catch (error) {
        console.error('Error generating clusters:', error);
      }
    }
  }, [viewport, listings]);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-100 min-h-screen relative">
      <div className="flex-1 rounded-lg overflow-hidden shadow-lg border border-gray-300 relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh]">
        <Map
          {...viewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          cooperativeGestures={true}
          onMove={(evt) => setViewport(evt.viewState)}
        >
          {clusters.map((cluster) => {
            const { coordinates } = cluster.geometry;
            const [longitude, latitude] = coordinates;
            const { cluster: isCluster, point_count } = cluster.properties || {};

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  longitude={longitude}
                  latitude={latitude}
                  anchor="center"
                >
                  <div
                    className="w-6 h-6 bg-red-600 text-white flex items-center justify-center rounded-full cursor-pointer"
                    onClick={() => {
                      const expansionZoom = Math.min(
                        superclusterRef.current.getClusterExpansionZoom(cluster.id) || 16,
                        16
                      );
                      setViewport({ ...viewport, zoom: expansionZoom, longitude, latitude });
                    }}
                  >
                    {point_count}
                  </div>
                </Marker>
              );
            }

            return (
              <Marker
                key={cluster.properties.id}
                longitude={longitude}
                latitude={latitude}
                anchor="center"
              >
                <div
                  className="w-3 h-3 bg-red-600 rounded-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedListing(cluster.properties);
                  }}
                />
              </Marker>
            );
          })}
        </Map>

        {selectedListing && (
          <div className="absolute top-4 right-4 bg-white shadow-lg rounded-md p-4 max-w-xs text-gray-800">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setSelectedListing(null)}>✖</button>
            <div 
              className="text-sm text-gray-700 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-1" 
              dangerouslySetInnerHTML={{ __html: selectedListing.description }} 
            />
            <p className="text-xs text-gray-500 mt-2">{selectedListing.address}</p>
            <Link href={`/listing/${selectedListing.id}`} className="text-blue-600 underline mt-2 block">More Details</Link>
          </div>
        )}
      </div>
      <div className="w-full md:w-1/3">
        <Newsfeed />
      </div>
    </div>
  );
}

function Newsfeed() {
  const updates = [
    { id: 1, message: 'New apartment added in Berlin', date: 'Feb 26, 2025' },
    { id: 2, message: 'Price drop for a house in Munich', date: 'Feb 25, 2025' },
    { id: 3, message: 'Villa in Hamburg now available', date: 'Feb 24, 2025' }
  ];

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg overflow-y-auto h-64 border border-gray-300">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Latest Updates</h2>
      <ul className="divide-y divide-gray-300">
        {updates.map((update) => (
          <li key={update.id} className="py-2">
            <a href={`/listing/${update.id}`} className="text-blue-600 font-medium hover:text-blue-800 transition duration-300">
              {update.message}
            </a>
            <p className="text-sm text-gray-500">{update.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
