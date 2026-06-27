const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://lampe.io",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const GITHUB_USERNAME = "lampemw";

const QUERY = `
 query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              color
            }
          }
        }
      }
    }
  }
`;

export default {
  async fetch(request, env) {
    console.log("Method:", request.method, "URL:", request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "GET") {
      console.log(request.method);
      return new Response(`${request.method} not allowed`, { status: 405 });
    }
    try {
      console.log(
        "Request body:",
        JSON.stringify({
          query: QUERY,
          variables: { username: GITHUB_USERNAME },
        }),
      );
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "github-contributions-worker",
        },
        body: JSON.stringify({
          query: QUERY,
          variables: { username: GITHUB_USERNAME },
        }),
      });

      const data = await response.json();
      console.log(data);
      console.log(response.status);
      if (data.errors) {
        return new Response(JSON.stringify({ error: data.errors }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      return new Response(JSON.stringify(data.data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
          ...CORS_HEADERS,
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    }
  },
};
