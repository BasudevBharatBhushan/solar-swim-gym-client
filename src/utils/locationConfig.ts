export interface LocationConfig {
  slug: string;
  name: string;
  id: string;
}

export const getLocationConfig = (): LocationConfig[] => {
  const locations: LocationConfig[] = [];
  let i = 1;
  while (true) {
    const slug = import.meta.env[`VITE_LOCATION_${i}_SLUG`];
    const name = import.meta.env[`VITE_LOCATION_${i}_NAME`];
    const id = import.meta.env[`VITE_LOCATION_${i}_ID`];

    if (!slug || !name || !id) break;

    locations.push({ slug, name, id });
    i++;
  }
  return locations;
};
