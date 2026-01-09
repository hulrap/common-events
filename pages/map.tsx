import { MapContainer } from '@/components/Map/MapContainer';
import { GetServerSideProps } from 'next';

// Force server-side rendering - map requires client-side Google Maps API
// This prevents Next.js from trying to statically generate this page at build time
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function MapPage() {
  return <MapContainer />;
}