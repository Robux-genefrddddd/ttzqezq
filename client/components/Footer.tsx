import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-background/50 mt-20">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Roblox_Logo.svg/2048px-Roblox_Logo.svg.png"
                alt="Roblox"
                className="h-5 object-contain"
              />
              <span className="font-semibold text-sm">RbxAssets</span>
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Digital marketplace for creators, developers, and studios.
            </p>
          </div>

          {/* Studios */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground text-xs uppercase tracking-widest">
              Studios
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Create
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Publish
                </a>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground text-xs uppercase tracking-widest">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/marketplace"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  to="/upload"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Upload
                </Link>
              </li>
              <li>
                <Link
                  to="/collections"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground text-xs uppercase tracking-widest">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/about"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground text-xs uppercase tracking-widest">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/privacy"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="section-divider my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Roblox Logo */}
            <a
              href="https://roblox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center opacity-100 hover:opacity-80 transition-opacity"
              aria-label="Roblox"
            >
              <img
                src="https://i.ibb.co/B531Dsh6/roblox-logo-roblox-symbol-meaning-history-and-evolution-3-removebg-preview.png"
                alt="Roblox"
                className="h-10 object-contain"
              />
            </a>
            <span className="text-xs text-muted-foreground/70 border-l border-white/10 pl-4">
              Not an official Roblox site
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/8 transition-all duration-200 text-muted-foreground/70 hover:text-foreground"
              aria-label="GitHub"
            >
              <Github size={16} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href="mailto:contact@assethub.com"
              className="p-2 rounded-lg hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Email"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
