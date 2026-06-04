import DarkModeToggle from "@/components/DarkModeToggle";
import Image from "next/image";

export default function LoginPage() {

    return (
        <div className= "dark:bg-zinc-900 "> 

            <DarkModeToggle />
            <div className="dark:bg-zinc-900 md:max-w-md mx-auto h-screen dark:text-white border-2 border-gray-300">
                <Image src="/k-logo.png" className="mx-auto mt-20" alt="Konneqta Logo" width={24} height={24} priority quality={75} />
                <div className="text-center pt-7 pb-14 mx-auto">
                    <h1 className="text-3xl font-extrabold ">Login your account</h1>
                    <p className="dark:text-[#737373]">Connect Smarter</p>
                </div>
                <form action="" className="w-fit mx-auto">
                    <div className="pb-4 flex flex-col w-fit mx-auto gap-1">
                        <label htmlFor="email">Email</label>
                        <input type="email" className="border pl-2 border-white w-93 h-13 rounded-xl " id="email" name="email"  placeholder="Enter your email" />
                    </div>
                    <div className="pb-4 flex flex-col gap-1 w-fit mx-auto">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" className="border pl-2 border-white w-93 h-13 rounded-xl" name="password" placeholder="Enter your password" />
                    </div>
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    )
}