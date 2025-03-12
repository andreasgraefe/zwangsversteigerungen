import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { id } = params;

    if (!id) {
        return new Response("Event ID is missing", { status: 400 });
    }

    // Fetch listing data from Google Sheets
    const response = await fetch(
        "https://opensheet.vercel.app/1HueWQVuM5LEzGmbDJj5bipF1Jqe-7bY8gLhQcz1F9Qg/immobilien"
    );
    const data = await response.json();
    const listing = data.find(item => item.PK_numerical.toString() === id);

    if (!listing) {
        return new Response("Listing not found", { status: 404 });
    }

    // Check if event is cancelled
    if (listing.Versteigerungstermin_cancelled === "1") {
        return new Response("Event cancelled", { status: 410 });
    }

    // Format date and time for ICS
    const dateParts = listing.Versteigerungstermin_Date.split(".");
    const timeParts = listing.Versteigerungstermin_Time.split(":");
    const [day, month, year] = dateParts.map(Number);
    const [hour, minute] = timeParts.map(Number);

    const eventDate = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;

    // Generate ICS calendar data
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Real Estate Listings//EN
BEGIN:VEVENT
UID:${id}@yourdomain.com
DTSTAMP:${eventDate}
DTSTART;TZID=Europe/Berlin:${eventDate}
SUMMARY:${listing.Objektüberschrift}
DESCRIPTION:${listing.Beschreibung.replace(/<\/?[^>]+(>|$)/g, "")}
LOCATION:${listing["Ort der Versteigerung"]}
END:VEVENT
END:VCALENDAR`;

    return new Response(icsData, {
        headers: {
            "Content-Type": "text/calendar",
            "Content-Disposition": `inline; filename=event_${id}.ics`,
        },
    });
}
