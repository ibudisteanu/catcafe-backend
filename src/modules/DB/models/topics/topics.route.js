import Topic from "./topic"
import Channel from "../channels/channel";
import StringHelper from "modules/helpers/string-helper";
import client from "../../redis";

async function getTopics(searchQuery, search, index, count, load){

    if (!index) index = 1;
    if ( !count ) count = 10;

    search = (search || '').toLowerCase();
    count = Math.min( count, 30);

    const out = await client.zrangeAsync( `topics:rank:hot:${searchQuery}:${search}`, (index-1)*count, index*count-1 );

    if (!load) return out;

    const p = [], data = [];
    for (const slug of out){
        const topic = new Topic(slug);
        p.push( topic.load() );
        data.push(topic);
    }

    await Promise.all(p);

    return data;
}

export default function (express){

    express.post( '/topics/create', async function(req, res ) {

        try{

            let { channel, title, link, body, author } = req.body;

            if (!channel || channel.length < 1) throw "Name is to small. Required at least 1 char";
            if (!title || title.length < 5) throw "Title is too small. Required at least 5 char";
            if (!link) link = '';
            if (!body) body = '';
            if (!author ) author = '';


            const channelModel = new Channel(channel);

            if (await channelModel.load() === false) throw "channel was not found";

            const slug = channelModel.slug + '/' + StringHelper.url_slug(  title );
            let existsTopic = new Topic();
            let suffix = '';

            do{
                existsTopic.slug = slug + suffix;
                suffix = '-' + StringHelper.makeId(8);
            } while (await existsTopic.load() );

            let preview = '';

            const topic = new Topic(existsTopic.slug, channelModel.slug, title, link, preview, body, author, channelModel.country, new Date().getTime() );

            await topic.save();
            res.json({result: true, topic: topic.toJSON() });


        }catch(err){
            res.status(500).json( err.toString() );
        }

    });

    express.get( '/topics/get/*', async function(req, res ) {

        try{

            let slug = req.params[0];

            if (!slug || slug.length < 1) throw "slug is not right";
            if (slug[0] === '/') slug = slug.substr(1);

            const topic = new Topic(slug);

            if ( await topic.load() === false)
                throw "Not found";

            res.json({result: true, topic: topic.toJSON()});


        }catch(err){
            res.status(500).json( err.toString() );
        }

    });

    express.post( '/topics/top', async function(req, res ) {

        try{

            let {searchQuery, search, index, count} = req.body;

            if (!search) search = '';
            if (search[0] === '/') search = search.substr(1);

            if (searchQuery === 'country' && !search ) search = 'us';

            const out = await getTopics( searchQuery, search, index, count, true);
            res.json({result: true, topics: out });


        }catch(err){
            res.status(500).json( err.toString() );
        }


    });


}