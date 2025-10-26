import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Vote, ShieldCheck, Users, Zap, BarChart } from "lucide-react";
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link to="/" className="flex items-center justify-center">
          <Vote className="h-6 w-6 text-blue-600" />
          <span className="ml-2 text-xl font-semibold">AgoraEdge</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link to="/auth" className="text-sm font-medium hover:underline underline-offset-4">
            Login
          </Link>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link to="/auth">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Secure, Scalable Online Voting for Modern Assemblies
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    AgoraEdge provides a unified platform for weighted voting, proxy delegation, and real-time quorum
                    tracking, all powered by Cloudflare's edge network for unparalleled performance.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link to="/auth">Start Your First Assembly</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <BarChart className="h-48 w-48 text-blue-200" />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted-foreground/10 px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need for Fair and Efficient Assemblies</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From complex weighted voting to secure proxy delegation, AgoraEdge handles the complexities so you can focus on governance.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <div className="grid gap-1">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-bold">Advanced Weighted Voting</h3>
                <p className="text-sm text-muted-foreground">
                  Assign custom coefficients to each participant for precise, share-based voting power.
                </p>
              </div>
              <div className="grid gap-1">
                <Users className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-bold">Proxy Delegation</h3>
                <p className="text-sm text-muted-foreground">
                  Enable members to securely delegate their voting rights to another participant for any assembly.
                </p>
              </div>
              <div className="grid gap-1">
                <Zap className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-bold">Real-Time Quorum & Results</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor assembly quorum and watch voting results update live, powered by edge computing for instant feedback.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 AgoraEdge. All rights reserved.</p>
        <p className="text-xs text-muted-foreground ml-auto">Built with ❤�� at Cloudflare</p>
      </footer>
    </div>
  );
}