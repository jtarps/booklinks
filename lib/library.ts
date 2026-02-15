export function getWorldCatLink(title: string, author: string): string {
  const searchQuery = encodeURIComponent(`${title} ${author}`);
  return `https://www.worldcat.org/search?q=${searchQuery}`;
}

export function getOpenLibraryLink(title: string, author: string): string {
  const searchQuery = encodeURIComponent(`${title} ${author}`);
  return `https://openlibrary.org/search?q=${searchQuery}`;
}

export function getLibraryOfCongressLink(title: string, author: string): string {
  const searchQuery = encodeURIComponent(`${title} ${author}`);
  return `https://catalog.loc.gov/vwebv/search?searchArg=${searchQuery}`;
}
