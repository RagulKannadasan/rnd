export default async function handler(req, res) {
  return res.status(200).json({
    message: "Hello from Vercel Functions!",
    timestamp: new Date().toISOString(),
  });
}