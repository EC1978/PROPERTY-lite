import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface RequestReviewEmailProps {
    propertyAddress?: string;
    propertyImageUrl?: string;
    reviewUrl?: string;
}

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const RequestReviewEmail = ({
    propertyAddress = "Prinsengracht 452, Amsterdam",
    propertyImageUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80",
    reviewUrl = "http://localhost:3000/review/mock-property-123",
}: RequestReviewEmailProps) => {
    const previewText = `Gefeliciteerd met de verkoop van uw woning! Hoe was uw ervaring?`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                primary: "#10b77f",
                                "background-dark": "#0A0A0A",
                                obsidian: "#0A0A0A",
                            },
                            fontFamily: {
                                sans: ["Inter", "sans-serif"],
                            },
                        },
                    },
                }}
            >
                <Body className="bg-obsidian my-auto mx-auto font-sans px-2 text-white">
                    <Container className="border border-solid border-[#ffffff1a] rounded-[12px] my-[40px] mx-auto p-[32px] w-[465px] bg-[#ffffff08]">
                        <Section className="mt-[24px]">
                            <div className="flex items-center justify-center space-x-2 text-center">
                                <Text className="text-white font-bold tracking-tight text-sm uppercase m-0 leading-tight">
                                    VoiceRealty AI
                                </Text>
                            </div>
                        </Section>
                        <Heading className="text-white text-[24px] font-bold text-center mt-[32px] mb-[16px]">
                            Hoe was uw ervaring?
                        </Heading>

                        <Section className="w-24 h-24 mx-auto mb-[32px]">
                            <div className="border-2 border-[#10b77f]/30 p-1 rounded-full w-24 h-24 mx-auto float-none">
                                <Img
                                    src={propertyImageUrl}
                                    width="86"
                                    height="86"
                                    alt={propertyAddress}
                                    className="rounded-full object-cover float-left"
                                />
                            </div>
                        </Section>

                        <Text className="text-white/70 text-[14px] leading-[24px] mb-[24px] text-center">
                            Gefeliciteerd met de verkoop van uw woning! We hopen dat onze Voice AI-agent u goed heeft geholpen. Zou u een moment willen nemen om uw ervaring met ons te delen?
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#10b77f] text-[#0A0A0A] font-bold py-4 px-8 rounded-lg text-center shadow-lg w-full block"
                                href={reviewUrl}
                            >
                                Schrijf een review
                            </Button>
                        </Section>

                        <Section className="bg-[#ffffff0d] border border-solid border-[#ffffff1a] rounded-[8px] p-[12px] mt-[16px]">
                            <Text className="text-[10px] text-white/40 uppercase font-bold tracking-widest m-0 mb-[4px]">
                                Verkocht Object
                            </Text>
                            <Text className="text-[14px] font-semibold text-white m-0">
                                {propertyAddress}
                            </Text>
                        </Section>

                        <Section className="text-center mt-[48px]">
                            <Text className="text-[10px] uppercase tracking-widest text-white/40 font-medium pb-4 border-b border-[#ffffff0d]">
                                © 2024 VoiceRealty AI • Premium Real Estate Solutions
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default RequestReviewEmail;
