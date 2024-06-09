import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        version: '',            // by default: '1.0.0'
        title: 'Starnet API',   // by default: 'REST API'
        description: ''         // by default: ''
    },
    servers: [
        {
            url: 'https://dev.starnet.ai/api.staging',  // http://35.220.170.58:3000  by default: 'http://localhost:3000'
            description: ''       // by default: ''
        },
    ],
    basePath: '',             // by default: '/'
    schemes: [],              // by default: ['http']
    consumes: [],             // by default: ['application/json']
    produces: [],             // by default: ['application/json']
    tags: [                   // by default: empty Array
        {
            name: '',             // Tag name
            description: ''       // Tag description
        },
        // { ... }
    ],
    // securityDefinitions: {
    //     apiKeyAuth: {
    //         type: "apiKey",
    //         in: "header",       // can be "header", "query" or "cookie"
    //         name: "authorization",  // name of the header, query parameter or cookie
    //         description: "any description..."
    //     }
    // },  // by default: empty object
    components: {
        schemas: {
            sortingColumns: {
                '@enum': ['budget', 'start-date', 'end-date']
            },
            sortingTrend: {
                '@enum': ['asc', 'desc']
            },
            kolCampaigns: {
                '@enum': ['all', 'pending', 'ongoing', 'expired', 'declined']
            },
            campaignStatus: {
                '@enum': ['draft', 'active', 'suspending', 'archived']
            },
            campaignApplicants: {
                '@enum': [
                    'open', 'applied', 'declined', 'approved', 'post-draft', 'post-submitted', 'post-launched'
                ]
            },
            campaignObjective: {
                campaign_id: 'be empty or existing campaign id e.g. 56',
                platforms: ['FB', 'IG', 'YT'], //
                region: 'Hong Kong',
                interests: ['Style&Fashion', 'Entertainment', 'Sports', 'Beauty'],
                objectives: [20, 15, 35, 30],
                creator_id: 72
            },
            campaignBasicInfo: {
                campaign_id: 'be empty or existing campaign id e.g. 56',
                img_banner: 'url of this image',
                title: 'This is a title',
                tagline: '#line-1#line-2#line-3',
                description: 'blablablablabla',
                budget: 29000.00,
                start_at: '2024-01-15',
                end_at: '2024-04-25',
                invitation_end_at: '2024-04-10',
                brand_name: 'no name',
                brand_logo: 'url of this logo image',
                creator_id: 72
            },
            campaignProduct: {
                campaign_id: 56,
                required: true,
                products: [{
                    id: 'be empty or existing product id e.g. 14',
                    type: '0:service | 1:product',
                    name: 'the name of this',
                    ref_url: 'https://aaabbbb.derr.fd.com',
                    remark: 'extra memo notes',
                    value: 5005.99,
                    sponsored: true,
                    img: 'url of this image'
                }]
            },
            campaignEvent: {
                campaign_id: 56,
                required: true,
                events: [{
                    id: 'be empty or existing event id e.g. 11',
                    title: 'the title of this event',
                    event_date: '2024-03-15',
                    event_time: '16:10:30',
                    description: 'somethin to be added here',
                    img: 'url of this image',
                    ref_url: 'https://reference_site'
                }]
            },
            campaignInfluencer: {
                campaign_id: 56,
                kol_types: [{
                    id: 'be empty or existing event id e.g. 11',
                    age_range: [18, 28],
                    follower_range: [1000, 15000],
                    gender: 'M',
                    kol_numbers: 3,
                    pay_range: [30000, 100000],
                    plat_code: 'FB | IG | YT', // FB | IG | YT
                    request: 'something to require'
                }]
            },
            campaignTask: {
                campaign_id: 56,
                tasks: [{
                    id: 'be empty or existing task id e.g. 11',
                    brand_hashtag: '#tag1#tag2#tag3',
                    brand_mention: 'mentioned about blablabla',
                    campaign_hashtag: '#tag1#tag2',
                    img: 'url of this image',
                    plat_code: 'FB | IG | YT', //YT, IG, FB
                    post_request: 'some special requirements',
                    post_type: 'e.g. story, video, blog', //story, video, blog
                    quantity: 30,
                    submit_date: '2024-02-15',
                    submit_time: '18:10:30',
                    suggest_content: 'contents suggested',
                }]
            },
            campaignDoDont: {
                campaign_id: 56,
                dodonts: [{
                    id: 'be empty or existing dodont id e.g. 11,',
                    type: '1:dos | 0:donts', // 1: dos, 0: donts    
                    request: 'do this action',
                    img: 'url of this image',
                }]
            },
            campaignInfluencerInvite: {
                campaign_id: 15,
                kolinvites: [{
                    profile_id: 'id of profile of a kol',
                    platform_code: 'FB, IG, or ..other social media',
                    follower_count: 'number of followers'
                }]
            },
            kolPostSelected: {
                "posts_selected": [1, 2, 3, 4]
            }
        },
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer'
            }
        }
    }
};

const outputFile = './swagger_doc.json'
const endpoints = ['./src/app.ts', './src/routes/users.ts', './src/routes/kols.ts',
    './src/routes/brands.ts', './src/routes/campaigns.ts', './src/routes/transactions.ts',
    './src/routes/uploader.ts', './src/routes/accountsync.ts', './src/routes/notifications.ts']

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpoints, doc)