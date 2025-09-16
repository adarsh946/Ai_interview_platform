import Container from "@/components/container";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div
      className=" relative h-screen bg-gradient-to-b from-emerald-100 via-emerald-50 to-emerald-100 
"
    >
      <Container>
        <Navbar />
        <Hero />
      </Container>
    </div>
  );
}
