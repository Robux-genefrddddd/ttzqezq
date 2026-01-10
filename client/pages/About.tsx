import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border/50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">About AssetHub</h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              A trusted digital asset marketplace for creators, developers, and studios.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-28 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-4">
                At AssetHub, we believe in making high-quality digital assets accessible to everyone. Our mission is to create a trusted marketplace where creators can share their work and users can find exactly what they need.
              </p>
              <p className="text-lg text-muted-foreground">
                We're committed to maintaining the highest standards of quality, security, and user experience.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop"
                alt="Team collaboration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-28 border-b border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-lg">Quality First</h3>
              <p className="text-muted-foreground">
                Every asset on our platform is carefully reviewed to ensure it meets our high quality standards.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-lg">Creator Focused</h3>
              <p className="text-muted-foreground">
                We empower creators with tools and fair compensation for their work.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-lg">Trust & Security</h3>
              <p className="text-muted-foreground">
                Your data and transactions are protected with enterprise-grade security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Our Team</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-${1494790108377 + i}?w=200&h=200&fit=crop`}
                    alt="Team member"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Team Member {i}</h3>
                  <p className="text-sm text-muted-foreground">Role Description</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators and users who trust AssetHub for their digital asset needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/marketplace"
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all inline-flex items-center justify-center gap-2"
            >
              Explore Marketplace
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 rounded-lg bg-secondary border border-border text-foreground font-semibold hover:bg-muted transition-all inline-flex items-center justify-center gap-2"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
