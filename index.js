const cheerio = require('cheerio');
const csv = require('csv')
const fs = require('fs');

async function getPages(pageUrl) {
    const results = [];

    for (let i = 1;;i++) {
        const result = await fetch(pageUrl + (i > 1 ? `&page=${i}` : ""), {redirect: 'manual'})

        if (result.status === 302) {
            break;
        }

        results.push(await result.text())
    }

    return results;
}

function parseAds(results) {
    const ads = [];
    results.forEach((html) => {
        const $ = cheerio.load(html);
        $(".advert__content-price > span").each((i, el) => {
            let price = "";
            el.children.forEach((ch) => {
                if (ch.type == "text") {
                    price += ch.data
                }
            })

            ads.push({
                link: "https://www.bazaraki.com" + el.parent.attribs["href"],
                price: price.trim().replace('.', '')
            })
        })
    })

    return ads;
}

async function main() {
    const pageUrl = process.argv[2]
    console.log(pageUrl)

    const pages = await getPages(pageUrl);
    const ads = parseAds(pages);

    const data = [];
    let columns = {
        link: 'link',
        price: 'price'
    };


    for (const ad of ads) {
        data.push([ad.link, ad.price]);
    }

    csv.stringify(data, {header: true, columns}, (err, output) => {
        if (!err) {
            fs.writeFileSync("result.csv", output)
            process.exit(0)
        } else {
            console.log(err)
            process.exit(1)
        }
    });
}

main();