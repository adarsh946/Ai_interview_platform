export default function Home() {
  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle,_#e5e5e5_1px,_transparent_1px)] [background-size:20px_20px]" />

      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-transparent to-pink-100/30" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold">Meet Flowmingo</h1>
        <p className="mt-4 max-w-xl text-center text-gray-600">
          Effortlessly conduct hundreds of insightful, personalized
          interviews...
        </p>
      </div>
    </div>
  );
}
