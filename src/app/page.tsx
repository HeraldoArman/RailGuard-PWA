import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!!session) {
    redirect("/dashboard");
  }
  if (!session){
    redirect("/sign-in")
  }

  return (
    <>
      <div></div>
    </>
  );
};

export default Page;
