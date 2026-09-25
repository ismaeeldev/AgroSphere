import { Container } from "./Container";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#113B13] text-white/80 pt-16 pb-8 border-t border-white/10">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Leaf className="h-8 w-8 text-[#4CAF50]" />
              <span className="text-2xl font-bold text-white tracking-tight">
                Agri<span className="text-[#4CAF50]">Vision</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm max-w-sm">
              Smart crop protection for modern agriculture. Providing trusted pesticide, herbicide, and organic farming solutions to farmers worldwide.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <a href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white hover:underline transition-all">About Us</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Careers</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Blog</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Global Branches</Link></li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white font-semibold mb-6">Products</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Insecticides</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Herbicides</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Fungicides</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Organic Care</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-6">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Shipping Information</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline transition-all">Returns Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <p>© {new Date().getFullYear()} AgroSphere. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
