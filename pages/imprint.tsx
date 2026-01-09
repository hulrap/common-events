import { GetServerSideProps } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function ImprintPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Imprint</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>Information according to § 5 TMG</h2>
          <p>
            <strong>COMMON EVENTS</strong>
            <br />
            [Address Information]
            <br />
            [Contact Information]
          </p>

          <h2>Contact</h2>
          <p>
            Email: create.events@conexu.app
          </p>

          <h2>Responsible for content according to § 55 Abs. 2 RStV</h2>
          <p>
            [Name and Address]
          </p>

          <h2>Disclaimer</h2>
          <h3>Liability for Contents</h3>
          <p>
            The contents of our pages have been created with the greatest care. However, we cannot guarantee the contents&apos; accuracy, completeness or topicality.
          </p>

          <h3>Liability for Links</h3>
          <p>
            Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

