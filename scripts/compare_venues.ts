
import fs from 'fs';
import path from 'path';

const userVenuesHtml = `<select class="sub" style="width:100%" name="loc"><option value="529">Aids Hilfe Wien</option><option value="1236">Alte Lampe</option><option value="43">Apollo City Sauna</option><option value="889">Architektur Bar der TU Wien</option><option value="796">Arena Wien</option><option value="1210">Augenblick</option><option value="827">Avalon Exil</option><option value="1079">Babylon Graz</option><option value="955">Badeschiff</option><option value="883">Beluga Club</option><option value="1151">Blue Angels</option><option value="960">Blue Heaven</option><option value="188">Blue Heaven Bar</option><option value="879">Bow4</option><option value="802">Cabaret Fledermaus</option><option value="804">Café Willendorf</option><option value="1184">Cafe Bar Börserl</option><option value="6">Café Savoy</option><option value="567">Café STANDARD</option><option value="7">Café Willendorf</option><option value="22">Café X Bar</option><option value="739">Camera Club</option><option value="1176">Chaya Fuera</option><option value="785">Cinemagic</option><option value="1199">CloneZone</option><option value="1203">Club F56</option><option value="965">Club Galerie</option><option value="751">Club Massiv</option><option value="687">Club Tresor</option><option value="958">Club-V</option><option value="824">Dom im Berg</option><option value="698">Dorian Gray Bar Graz</option><option value="24">EAGLE Vienna</option><option value="1093">ega - Frauenzentrum</option><option value="1166">ES Collection Vienna</option><option value="797">Fabrik</option><option value="818">Feel Free RLP</option><option value="464">Felixx</option><option value="748">Flex</option><option value="948">Fluc</option><option value="1049">Frauencafé im Theater am Lend</option><option value="8">Frauencafé Wien</option><option value="153">Frauenhetz</option><option value="9">FZ - Bar  Frauenzentrum Bar</option><option value="829">Generalmusikdirektion Graz</option><option value="933">Gerard Tanzbar</option><option value="862">Grazer Congress</option><option value="1094">GUGG</option><option value="1057">HARDON</option><option value="912">Helmut List Halle</option><option value="202">HOSI Linz</option><option value="216">HOSI Salzburg</option><option value="251">HOSI Tirol</option><option value="766">Hosi Wien</option><option value="888">Insas</option><option value="1146">Inside</option><option value="397">Kaiserbründl</option><option value="729">Kantine</option><option value="470">Kino Labyrinth Wien10</option><option value="1043">LOFT Graz</option><option value="1037">Lounge-Bar Stadtkrämer</option><option value="1096">lutz - der club</option><option value="60">Löwenherz</option><option value="27">Mango Bar</option><option value="446">Marea Alta</option><option value="1058">Mexxx Gay Bar</option><option value="806">Museumsquartier</option><option value="881">Musikpark A1</option><option value="29">Nightshift</option><option value="1235">OPERA CLUB</option><option value="788">Orpheum</option><option value="907">Ost - Klub</option><option value="944">Papillon Bi Sauna</option><option value="973">Planetarium am Praterstern</option><option value="814">Postgarage Veranstaltungshalle</option><option value="860">PPC Graz</option><option value="1142">PraterDome</option><option value="1067">Pratersauna</option><option value="911">Pyramide Vösendorf</option><option value="1144">RAGE Graz - Men´s Club</option><option value="1186">RedFloor</option><option value="828">Rhiz</option><option value="661">Rifugio Tagescafé</option><option value="1222">ROPP</option><option value="782">Roxy</option><option value="1092">Rush Graz</option><option value="1174">Römersauna</option><option value="764">Sargfabrik Bade- u. Kulturhaus</option><option value="816">Schikaneder Kino und Bar</option><option value="21">Sling</option><option value="487">Sportsauna</option><option value="974">Strass Lounge Bar</option><option value="778">Tanzquartier Wien</option><option value="1075">THE HIVE</option><option value="1063">Tomba’s Heurigenstadl</option><option value="602">U4 Vienna</option><option value="767">U96</option><option value="1012">UTOPIA</option><option value="35">Versteck</option><option value="853">Villa</option><option value="573">Village Bar</option><option value="1008">Viper Room</option><option value="746">Volksgarten</option><option value="895">Volkstheater Rote Bar</option><option value="803">Weberknecht</option><option value="494">Why Not</option><option value="36">Wiener Freiheit</option><option value="815">Wiener Metropol</option><option value="771">Wiener Rathaus</option><option value="781">Wirr</option><option value="1050">ZIZAS Gayclub-Lounge</option><option value="1091">Zum Kuchlbaron</option></select>`;

const extractVenues = (html: string) => {
    const regex = />([^<]+)<\/option>/g;
    const venues = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        venues.push(match[1].trim());
    }
    return venues;
};

const userVenues = extractVenues(userVenuesHtml);
const existingVenuesPath = path.join(process.cwd(), 'config', 'venues', 'merged-venues.json');
const existingVenues = JSON.parse(fs.readFileSync(existingVenuesPath, 'utf-8'));
const existingVenueNames = new Set(existingVenues.map((v: any) => v.name.toLowerCase()));

// Also check for partial matches or alternative names
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const missingVenues = userVenues.filter(userVenue => {
    const normalizedUserVenue = normalize(userVenue);
    // Check exact match (case insensitive)
    if (existingVenueNames.has(userVenue.toLowerCase())) return false;

    // Check normalized match
    const normalizedMatch = existingVenues.some((v: any) => normalize(v.name) === normalizedUserVenue);
    if (normalizedMatch) return false;

    // Check if user venue is contained in existing venue name or vice versa
    const partialMatch = existingVenues.some((v: any) => {
        const normV = normalize(v.name);
        return normV.includes(normalizedUserVenue) || normalizedUserVenue.includes(normV);
    });

    // If partial match found, we might want to flag it but for now let's be strict to find definitely missing ones
    return true;
});

const output = missingVenues.map(v => {
    // Find potential close matches
    const potentialMatches = existingVenues.filter((ev: any) => {
        const normEv = normalize(ev.name);
        const normUser = normalize(v);
        return normEv.includes(normUser) || normUser.includes(normEv);
    });

    if (potentialMatches.length > 0) {
        return `- ${v} (Potential match: ${potentialMatches.map((p: any) => p.name).join(', ')})`;
    } else {
        return `- ${v}`;
    }
}).join('\n');

fs.writeFileSync('missing_venues_utf8.txt', "Missing Venues:\n" + output);
console.log("Written to missing_venues_utf8.txt");
