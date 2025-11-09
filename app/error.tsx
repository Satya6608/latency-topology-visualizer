"use client";

export default function Error({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold text-red-600">Something went wrong!</h1>
      <p className="text-gray-500 mt-2">{error.message}</p>
    </div>
  );
}
