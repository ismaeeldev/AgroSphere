import { getProductById, getRelatedProducts } from "@/lib/getProduct";
import { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductById(resolvedParams.id);

  if (!product) {
    return {
      title: 'Product Not Found | AgroSphere',
    };
  }

  return {
    title: `${product.name} | AgroSphere`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await getProductById(resolvedParams.id);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#1B5E20] mb-4">Product not found 🌱</h1>
          <p className="text-zinc-500 mb-6">The product you are looking for does not exist or has been removed.</p>
          <a href="/products" className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-[#1B5E20] text-white font-semibold hover:bg-[#4CAF50] transition-colors">
            ← Back to Products
          </a>
        </div>
      </div>
    );
  }


  return <ProductDetailsClient initialProduct={product} />;
}
