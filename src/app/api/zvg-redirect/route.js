export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const zvg_id = searchParams.get("zvg_id");
    const land_abk = searchParams.get("land_abk");
  
    try {
      // First request to obtain initial cookies
      const initialRes = await fetch('https://www.zvg-portal.de/index.php?button=Suchen', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/html',
          'Referer': 'https://www.zvg-portal.de/',
        },
      });
  
      const cookies = initialRes.headers.get('set-cookie');
      
      if (!cookies) {
        return new Response(JSON.stringify({ error: "No cookies returned by ZVG-Portal (initial request)" }), { status: 500 });
      }
  
      // Extracting cookies for next request
      const cookie = initialRes.headers.get('set-cookie').split(';')[0];
  
      const detailRes = await fetch(`https://www.zvg-portal.de/index.php?button=showZvg&zvg_id=${zvg_id}&land_abk=${land_abk}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/html',
          'Referer': 'https://www.zvg-portal.de/index.php?button=Suchen',
          'Cookie': cookie
        },
      });
  
      const html = await detailRes.text();
  
      if (html.includes("ERROR") || html.includes("falsche Parameter")) {
        return new Response(JSON.stringify({ error: "Invalid parameters or session error." }), { status: 400 });
      }
  
      // Successful, redirect user
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
  
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
  