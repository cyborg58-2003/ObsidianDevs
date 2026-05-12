const url = "https://bzhhpidhjkswhrqbdhhm.supabase.co/rest/v1/availability_slots?select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6aGhwaWRoamtzd2hycWJkaGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzEzNDAsImV4cCI6MjA5NDE0NzM0MH0.ZNG1FYbiiVS9RRkZqpGj64GU-V9xVkyj3gTFtMChOZ4";

async function test() {
  const res = await fetch(url, {
    headers: {
      "apikey": key,
      "Authorization": "Bearer " + key
    }
  });
  if (!res.ok) {
    console.error("Error fetching:", res.status, res.statusText);
    const text = await res.text();
    console.error(text);
  } else {
    const data = await res.json();
    console.log("Data length:", data.length);
    if (data.length > 0) {
      console.log("First item:", data[0]);
    } else {
      console.log("Empty data array returned.");
    }
  }
}
test();
