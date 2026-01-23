import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the first step of the wizard
  redirect("/challenge");
}
