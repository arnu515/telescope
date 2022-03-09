export async function sendEmail({
  email,
  text,
  html,
}: { email: string; text: string; html: string }) {
  console.log({ email, text, html });
  const res = await fetch(
    `https://${Deno.env.get("MAILJET_USER")}:${
      Deno.env.get("MAILJET_PASS")
    }@api.mailjet.com/v3.1/send`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: "noreply@telescope.ml",
              Name: "Telescope",
            },
            To: [
              {
                Email: email,
              },
            ],
            Subject: "You have been invited to a telescope meeting",
            TextPart: text,
            HTMLPart: html,
          },
        ],
      }),
    },
  );
  console.log(JSON.stringify({ res: await res.json() }, null, 2));
}
