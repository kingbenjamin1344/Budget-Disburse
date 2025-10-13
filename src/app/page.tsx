import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
  return null; // <- Add this so it’s a valid React component
}
