"use client";

import { INews } from "@/models/News";
import { ICategory } from "@/models/Category";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface NewsCardProps {
  item: INews;
}

const formatDate = (dateString?: Date | string): string => {
  if (!dateString) return "Date not available";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateString);
  }
};

const cleanDescription = (html?: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ") // Replace HTML tags with space
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

const getFaviconUrl = (domain: string) => {
    if (!domain) return "/placeholder-favicon.svg"; // Provide a generic placeholder
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

const getWebsiteName = (domain: string) => {
    if (!domain) return "Unknown Source";
    // Basic extraction, might need refinement for complex domains
    const parts = domain.replace(/^www\./, "").split('.');
    return parts.length > 1 ? parts[0] : parts[0]; // Return first part, e.g., 'kalbela' from 'kalbela.com'
};


export default function NewsCard({ item }: NewsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const description = cleanDescription(item.description);
  // Show more initially if expanded, and ensure 'Read More' shows if text is longer than snippet
  const shortDescription = description.slice(0, 150);
  const displayDescription = isExpanded ? description : shortDescription;
  const canBeExpanded = description.length > 150;

  const category = item.category as ICategory;

  return (
    <article className="bg-white shadow-lg rounded-lg overflow-hidden mb-6 transition-shadow duration-300 hover:shadow-xl group">
      <div className={`flex ${isExpanded ? 'flex-col' : 'flex-col sm:flex-row'} items-start`}>
        {item.images && item.images.length > 0 && !imageError && (
          <Link href={`/news/${item._id}`} className={`w-full ${isExpanded ? 'sm:h-80 h-60' : 'sm:w-1/3 sm:h-auto h-52'} flex-shrink-0 block relative overflow-hidden`}>
            <Image
              src={item.images[0]}
              alt={item.title}
              width={isExpanded ? 800 : 400} // Adjusted for better quality
              height={isExpanded ? 450 : 225}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              priority={!isExpanded}
            />
          </Link>
        )}
        {(imageError || !item.images || item.images.length === 0) && (
             <Link href={`/news/${item._id}`} className={`w-full ${isExpanded ? 'sm:h-80 h-60' : 'sm:w-1/3 sm:h-44 h-52'} flex-shrink-0 block bg-gray-100 flex items-center justify-center text-gray-300`}>
                {/* Placeholder Icon */}
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10zm-9.414-5.414a1 1 0 010-1.414l2.5-2.5a1 1 0 011.414 0l2.5 2.5a1 1 0 01-1.414 1.414L10 7.414l-1.914 1.914a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </Link>
        )}

        <div className="p-5 flex-grow w-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
              {item.domain && (
                  <>
                  <Image
                      src={getFaviconUrl(item.domain)}
                      alt={`${item.domain} favicon`}
                      className="w-4 h-4 rounded-full"
                      width={16}
                      height={16}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="font-medium capitalize hover:text-indigo-600">{getWebsiteName(item.domain)}</span>
                  <span className="mx-1 text-gray-300">|</span>
                  </>
              )}
              {category?.title && (
                   <Link href={`/category/${category._id}`} className="hover:text-indigo-600 font-medium">
                      {category.title}
                   </Link>
              )}
            </div>

            <Link href={`/news/${item._id}`}>
              <h2 className={`text-lg sm:text-xl font-semibold text-gray-800 hover:text-indigo-700 mb-2 transition-colors ${isExpanded ? '' : 'line-clamp-2'}`}>
                {item.title}
              </h2>
            </Link>

            <p className={`text-gray-600 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
              {displayDescription}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(item.pubDate)}</span>
            <div className="flex items-center space-x-3">
                {canBeExpanded && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-indigo-600 hover:underline font-medium">
                    {isExpanded ? "Show Less" : "Show More"}
                </button>
                )}
                <Link href={item.source_link} target="_blank" rel="noopener noreferrer" title="Read original article" className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M10 5v2h6.586l-4.293 4.293l1.414 1.414L18 8.414V15h2V5H10Z"/><path fill="currentColor" d="M4 19h16v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7v2H4v14Z"/></svg>
                </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
