"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ListingPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);

  useEffect(() => {
    if (!id) return;

    fetch(
      "https://opensheet.vercel.app/1HueWQVuM5LEzGmbDJj5bipF1Jqe-7bY8gLhQcz1F9Qg/immobilien"
    )
      .then((response) => response.json())
      .then((data) => {
        const selectedListing = data.find(
          (item) => item.PK_numerical.toString() === id
        );
        if (selectedListing) {
          setListing({
            id,
            title: selectedListing.Objektüberschrift,
            address: selectedListing.Adresse,
            description: selectedListing.Beschreibung,
            date: selectedListing.Versteigerungstermin_Date,
            time: selectedListing.Versteigerungstermin_Time,
            location: selectedListing["Ort der Versteigerung"],
            cancelled: selectedListing.Versteigerungstermin_cancelled === "1",
            zvg_id: selectedListing.zvg_id,
            land_abk: selectedListing.land_abk,
          });
        }
      })
      .catch((error) => console.error("Error fetching listing:", error));
  }, [id]);

  if (!listing) {
    return <p className="text-center text-gray-500 mt-10">Loading...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6 border border-gray-300">
      <p className="text-sm text-gray-600 mb-2">{listing.address}</p>
      <div
        className="text-gray-800 text-lg [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-3"
        dangerouslySetInnerHTML={{ __html: listing.description }}
      />
      <p className="text-sm text-gray-500 mb-2">
        📅 {listing.cancelled ? "❌ Termin abgesagt" : `Versteigerungstermin: ${listing.date} um ${listing.time}`}
        {!listing.cancelled && (
          <a
            href={`${
              typeof window !== "undefined" && window.location.hostname === "localhost"
                ? `http://localhost:3000/api/calendar/${listing.id}`
                : `webcal://${window.location.hostname}/api/calendar/${listing.id}`
            }`}
            className="ml-2 px-3 py-1 bg-green-600 text-white rounded-md text-center hover:bg-green-800"
          >
            📥 Terminänderungen erhalten
          </a>
        )}
      </p>
      <p className="text-sm text-gray-500 mb-4">
        📍 Versteigerungsort: {listing.location}
      </p>

      {!listing.cancelled && listing.zvg_id && listing.land_abk && (
        <a
          href={`https://www.zvg-portal.de/index.php?button=Termine%20suchen&land_abk=${listing.land_abk}&ger_name=&zvg_id=${listing.zvg_id}`}
          target="_blank"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-800"
        >
          Weitere Informationen
        </a>
      )}

      <Link href="/" className="text-blue-600 underline block mt-6">
        Zurück zur Karte
      </Link>
    </div>
  );
}
