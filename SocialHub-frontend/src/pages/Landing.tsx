import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import {
  Users,
  MessageSquare,
  Shield,
  Smartphone,
  ArrowRight,
  Globe,
  Activity
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Global Community",
    description: "Connect with thousands of creators and thinkers from around the globe in real-time."
  },
  {
    icon: MessageSquare,
    title: "Rich Conversations",
    description: "Engage in deep, threaded discussions with markdown support and media attachments."
  },
  {
    icon: Activity,
    title: "Real-time Feed",
    description: "Experience a blazing-fast, intelligent feed tailored to your interests and connections."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Your data is encrypted and protected with industry-leading privacy standards."
  },
  {
    icon: Globe,
    title: "Discover Trends",
    description: "Explore what's happening around the world right now with advanced hashtag analytics."
  },
  {
    icon: Smartphone,
    title: "Flawless Mobile",
    description: "Enjoy a pixel-perfect experience whether you are on desktop, tablet, or smartphone."
  }
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header isAuthenticated={false} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container relative z-10 px-6 mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel mb-8 animate-fade-in">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary-light">The next generation of social networking</span>
          </div>

          <h1 className="text-hero mb-6 max-w-5xl text-highlight animate-float" style={{ animationDuration: '8s' }}>
            Where Ideas <br className="hidden md:block" /> Connect & Thrive.
          </h1>

          <p className="text-subtitle mb-10 max-w-2xl mx-auto text-muted-foreground">
            Join an exclusive community of forward-thinkers. Share your story, discover trending topics, and build meaningful relationships in a beautifully designed space.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-sm sm:max-w-none mx-auto">
            <Link to="/auth?mode=signup" className="w-full sm:w-auto">
              <Button className="btn-hero text-lg px-8 py-6 w-full sm:w-auto">
                Start Exploring
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth?mode=signin" className="w-full sm:w-auto">
              <Button className="btn-secondary text-lg px-8 py-6 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 relative z-10">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-white">
              Engineered for <span className="text-primary">Excellence</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every detail has been crafted to provide you with the most seamless and immersive social experience possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="card-interactive hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-solid opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass-panel text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-3 text-white group-hover:text-primary-light transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative z-10">
        <div className="container px-6 mx-auto">
          <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 p-8 md:p-20 text-center">
            <div className="absolute inset-0 bg-primary/5 opacity-30"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                Ready to elevate your social experience?
              </h2>
              <p className="text-xl mb-10 text-primary-light/80">
                Join thousands of users who have already made the switch to the most beautifully designed platform on the web.
              </p>
              <Link to="/auth?mode=signup" className="block w-full max-w-sm mx-auto sm:max-w-none sm:w-auto">
                <Button className="btn-hero text-lg px-10 py-6 w-full sm:w-auto">
                  Create Your Account
                  {/* <ArrowRight className="ml-2 h-5 w-5 inline" /> */}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 relative z-10">
        <div className="container px-6 mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-heading text-xl font-bold text-white">SocialHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SocialHub. Crafted with precision.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;