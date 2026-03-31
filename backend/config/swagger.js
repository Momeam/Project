const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'HomeLink API (Premium & Modular)',
        version: '2.2.0',
        description: 'ระบบ API สำหรับแพลตฟอร์มอสังหาริมทรัพย์ - เพิ่มช่องกรอกข้อมูล (Request Body) ครบทุก Endpoint',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Local Development Server' }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            }
        },
        schemas: {
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', example: 'admin@homelink.com' },
                    password: { type: 'string', example: '123456' }
                }
            },
            RegisterRequest: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                    username: { type: 'string', example: 'alex_premium' },
                    email: { type: 'string', example: 'alex@example.com' },
                    password: { type: 'string', example: '123456' },
                    tel: { type: 'string', example: '0812345678' }
                }
            },
            PropertyRequest: {
                type: 'object',
                required: ['title', 'price'],
                properties: {
                    title: { type: 'string', example: 'คาร์ซ่า คอนโด สุขุมวิท 101' },
                    description: { type: 'string', example: 'คอนโดหรูติดรถไฟฟ้า พร้อมเฟอร์นิเจอร์' },
                    type: { type: 'string', enum: ['SALE', 'RENT'], example: 'SALE' },
                    category: { type: 'string', example: 'CONDO' },
                    price: { type: 'number', example: 4500000 },
                    address: { type: 'string', example: '123 ถนนสุขุมวิท' },
                    province: { type: 'string', example: 'Bangkok' },
                    bedrooms: { type: 'integer', example: 2 },
                    bathrooms: { type: 'integer', example: 1 },
                    size: { type: 'number', example: 45 },
                    interiorDetails: { type: 'string', example: 'พื้นปาร์เก้, แอร์ 3 เครื่อง, เตาไฟฟ้า' }
                }
            }
        }
    },
    security: [{ bearerAuth: [] }],
    paths: {
        // --- Users & Auth ---
        '/api/users/login': { 
            post: { 
                tags: ['Users'], 
                summary: 'เข้าสู่ระบบ',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
                },
                responses: { 200: { description: 'Login Success' } }
            } 
        },
        '/api/users/register': { 
            post: { 
                tags: ['Users'], 
                summary: 'สมัครสมาชิก',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
                },
                responses: { 201: { description: 'Registered Successfuly' } }
            } 
        },
        '/api/users/me': { 
            get: { tags: ['Users'], summary: 'ดึงข้อมูลโปรไฟล์ส่วนตัว', security: [{ bearerAuth: [] }] },
            put: { 
                tags: ['Users'], 
                summary: 'แก้ไขข้อมูลโปรไฟล์ส่วนตัว', 
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, tel: { type: 'string' } } } } }
                }
            } 
        },

        // --- Admin (User Management) ---
        '/api/users': { 
            get: { tags: ['Admin (User Management)'], summary: 'ดึงรายชื่อผู้ใช้ทั้งหมด (Admin Only)', security: [{ bearerAuth: [] }] } 
        },
        '/api/users/{id}/role': { 
            put: { 
                tags: ['Admin (User Management)'], 
                summary: 'เปลี่ยนบทบาทผู้ใช้', 
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { role: { type: 'string', enum: ['USER', 'SELLER', 'ADMIN'] } } } } }
                }
            } 
        },
        '/api/users/{id}': { 
            delete: { 
                tags: ['Admin (User Management)'], 
                summary: 'ลบผู้ใช้ออกจากระบบ', 
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
            } 
        },
        
        // --- Properties ---
        '/api/properties': { 
            get: { tags: ['Properties'], summary: 'ดึงรายการประกาศทั้งหมด' }, 
            post: { 
                tags: ['Properties'], 
                summary: 'สร้างประกาศใหม่', 
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PropertyRequest' } } }
                }
            } 
        },
        '/api/properties/search': { 
            get: { 
                tags: ['Properties'], 
                summary: 'ค้นหาและกรอง',
                parameters: [
                    { name: 'minPrice', in: 'query', schema: { type: 'number' } },
                    { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
                    { name: 'province', in: 'query', schema: { type: 'string' } }
                ]
            } 
        },
        '/api/properties/{id}': { 
            get: { tags: ['Properties'], summary: 'ดึงรายละเอียดรายประกาศ' },
            put: { 
                tags: ['Properties'], 
                summary: 'แก้ไขประกาศ', 
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PropertyRequest' } } }
                }
            },
            delete: { tags: ['Properties'], summary: 'ลบประกาศ', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
        },

        // --- Announcements ---
        '/api/announcements': { 
            get: { tags: ['Announcements'], summary: 'ดึงประกาศ Banner' }, 
            post: { 
                tags: ['Announcements'], 
                summary: 'สร้างประกาศใหม่ (Admin Only)', 
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, type: { type: 'string' } } } } }
                }
            } 
        }
    }
};

module.exports = swaggerDocument;
