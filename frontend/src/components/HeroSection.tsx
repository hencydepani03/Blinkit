import { Button } from "@/components/ui/button";
import { Clock, Truck, ShieldCheck } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="bg-gradient-hero text-white py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                India's last minute app
              </h1>
              <p className="text-xl md:text-2xl text-white/90">
                Get everything delivered in minutes
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Clock className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold">8 minutes</p>
                  <p className="text-sm text-white/80">Delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Truck className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold">Free delivery</p>
                  <p className="text-sm text-white/80">On ₹199+</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-semibold">100% safe</p>
                  <p className="text-sm text-white/80">Guarantee</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="xl"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
                onClick={() => {
                  const el = document.getElementById('category-grid');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                Start Shopping
              </Button>
             
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in">
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="Fresh groceries and delivery"
                className="w-full h-auto max-w-lg mx-auto rounded-2xl shadow-strong"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;