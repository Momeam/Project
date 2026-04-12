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
                    interiorDetails: { type: 'string', example: 'พื้นปาร์เก้, แอร์ 3 เครื่อง, เตาไฟฟ้า' },
                    status: { type: 'string', enum: ['ACTIVE', 'SOLD', 'BOOKED', 'INACTIVE'], example: 'ACTIVE' }
                }
            },
            InquiryRequest: {
                type: 'object',
                required: ['receiver_id', 'property_id', 'message'],
                properties: {
                    receiver_id: { type: 'string', example: 'seller_id_here' },
                    property_id: { type: 'string', example: 'property_id_here' },
                    message: { type: 'string', example: 'สนใจทรัพย์นี้ครับ ลดราคาได้อีกไหม?' }
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
                summary: 'เข้าสู่ระบบ (Login)',
                description: 'ใช้สำหรับส่งอีเมลและรหัสผ่านเพื่อรับ Token เข้าถึงระบบ',
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
                summary: 'สมัครสมาชิก (Register)',
                description: 'ใช้สำหรับสร้างบัญชีผู้ใช้ใหม่ในระบบ',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
                },
                responses: { 201: { description: 'Registered Successfuly' } }
            } 
        },
        '/api/users/me': { 
            get: { 
                tags: ['Users'], 
                summary: 'ดึงข้อมูลโปรไฟล์ส่วนตัว', 
                description: 'ใช้ Token ในการยืนยันตัวตนเพื่อดึงข้อมูลส่วนตัวของผู้ใช้ที่เข้าสู่ระบบอยู่',
                security: [{ bearerAuth: [] }] 
            },
            put: { 
                tags: ['Users'], 
                summary: 'แก้ไขข้อมูลโปรไฟล์ส่วนตัว', 
                description: 'ใช้สำหรับอัปเดตข้อมูลผู้ใช้ เช่น ชื่อผู้ใช้ หรือเบอร์โทรศัพท์',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, tel: { type: 'string' } } } } }
                }
            } 
        },

        // --- Admin (User Management) ---
        '/api/users': { 
            get: { 
                tags: ['Admin (User Management)'], 
                summary: 'ดึงรายชื่อผู้ใช้ทั้งหมด', 
                description: 'ดึงรายชื่อผู้ใช้ทุกคนในระบบ (เฉพาะ Admin เท่านั้น)',
                security: [{ bearerAuth: [] }] 
            } 
        },
        '/api/users/{id}/role': { 
            put: { 
                tags: ['Admin (User Management)'], 
                summary: 'เปลี่ยนบทบาทผู้ใช้ (Role)', 
                description: 'เปลี่ยนบทบาทของผู้ใช้ (USER, SELLER, ADMIN) โดยใช้ ID',
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
                description: 'ลบข้อมูลผู้ใช้ถาวรออกจากฐานข้อมูล',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
            } 
        },
        
        // --- Properties ---
        '/api/properties': { 
            get: { 
                tags: ['Properties'], 
                summary: 'ดึงรายการประกาศทั้งหมด',
                description: 'ใช้สำหรับแสดงผลหน้าหลักหรือรายการอสังหาฯ ทั้งหมด'
            }, 
            post: { 
                tags: ['Properties'], 
                summary: 'สร้างประกาศใหม่', 
                description: 'ผู้ขายหรือแอดมินใช้สร้างประกาศขาย/เช่าอสังหาฯ ใหม่',
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
                summary: 'ค้นหาและกรอง (Search & Filter)',
                description: 'ค้นหาตามช่วงราคา, จังหวัด, ประเภท หรือจำนวนห้องนอน',
                parameters: [
                    { name: 'minPrice', in: 'query', schema: { type: 'number' } },
                    { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
                    { name: 'province', in: 'query', schema: { type: 'string' } },
                    { name: 'type', in: 'query', schema: { type: 'string', enum: ['SALE', 'RENT'] } },
                    { name: 'category', in: 'query', schema: { type: 'string' } },
                    { name: 'bedrooms', in: 'query', schema: { type: 'integer' } }
                ]
            } 
        },
        '/api/properties/{id}': { 
            get: { 
                tags: ['Properties'], 
                summary: 'ดึงรายละเอียดรายประกาศ',
                description: 'ดึงข้อมูลทั้งหมดของทรัพย์นั้นๆ รวมถึงข้อมูลเจ้าของและรูปภาพ',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
            },
            put: { 
                tags: ['Properties'], 
                summary: 'แก้ไขประกาศ', 
                description: 'แก้ไขข้อมูลในประกาศที่เคยลงไว้ (เฉพาะเจ้าของหรือแอดมิน)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/PropertyRequest' } } }
                }
            },
            delete: { 
                tags: ['Properties'], 
                summary: 'ลบประกาศ', 
                description: 'ลบประกาศออกจากระบบ (เฉพาะเจ้าของหรือแอดมิน)',
                security: [{ bearerAuth: [] }], 
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] 
            }
        },
        '/api/properties/{id}/view': {
            patch: {
                tags: ['Properties'],
                summary: 'เพิ่มจำนวนผู้เข้าชม (Increment View)',
                description: 'เรียกใช้เมื่อมีการเปิดดูหน้ารายละเอียดเพื่อเก็บสถิติความนิยม',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]
            }
        },

        // --- Property Layouts & Sandbox ---
        '/api/properties/units': {
            post: {
                tags: ['Property Layouts & Sandbox'],
                summary: 'เพิ่มห้องใหม่ในโครงการ (Manual Add Room)',
                description: 'เพิ่มห้องเดี่ยวลงในผังโครงการตาม Grid',
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { property_id: { type: 'string' }, floor_number: { type: 'integer' }, room_number: { type: 'string' }, grid_x: { type: 'integer' }, grid_y: { type: 'integer' }, grid_w: { type: 'integer' }, grid_h: { type: 'integer' }, price: { type: 'number' } } } } }
                },
                responses: { 201: { description: 'Room added' } }
            }
        },
        '/api/properties/units/bulk': {
            post: {
                tags: ['Property Layouts & Sandbox'],
                summary: 'เพิ่มห้องแบบกลุ่ม (Bulk Create)',
                description: 'สร้างหลายห้องพร้อมกันในระบบผังห้อง Sandbox',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { units: { type: 'array', items: { type: 'object' } } } } } } },
                responses: { 201: { description: 'Bulk rooms created' } }
            },
            put: {
                tags: ['Property Layouts & Sandbox'],
                summary: 'บันทึกผังห้องแบบกลุ่ม (Bulk Update Layout)',
                description: 'อัปเดตข้อมูล Grid และพิกัดห้องพร้อมกันหลายห้องในหน้า Sandbox',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { units: { type: 'array', items: { type: 'object' } } } } } } },
                responses: { 200: { description: 'Bulk layouts updated' } }
            }
        },
        '/api/properties/units/{unitId}': {
            patch: {
                tags: ['Property Layouts & Sandbox'],
                summary: 'อัปเดตรายละเอียดรายห้อง (รวมถึงผังภายใน layout_json)',
                description: 'แก้ไขราคา ขนาด หรือโครงสร้างผังห้องภายใน (Room Layout)',
                parameters: [{ name: 'unitId', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, price: { type: 'number' }, size: { type: 'number' }, layout_json: { type: 'object' } } } } } },
                responses: { 200: { description: 'Room updated' } }
            },
            delete: {
                tags: ['Property Layouts & Sandbox'],
                summary: 'ลบห้องออกจากผังโครงการ',
                description: 'ลบห้องที่ไม่ต้องการออกจากตัวแปลน (ลบถาวร)',
                parameters: [{ name: 'unitId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Room deleted' } }
            }
        },
        '/api/properties/units/bulk-delete': {
            post: {
                tags: ['Property Layouts & Sandbox'],
                summary: 'ลบห้องแบบกลุ่ม (Bulk Delete)',
                description: 'ส่ง Array ของ ID ห้องเพื่อลบพร้อมกัน',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } } } },
                responses: { 200: { description: 'Bulk rooms deleted' } }
            }
        },
        '/api/properties/{id}/floors/{floorNumber}/units': {
            delete: {
                tags: ['Property Layouts & Sandbox'],
                summary: 'ลบห้องทั้งชั้นออกจากโครงการ (Floor Reset)',
                description: 'ล้างข้อมูลห้องทั้งหมดในชั้นใดชั้นหนึ่ง',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'floorNumber', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: { 200: { description: 'Floor reset successfully' } }
            }
        },

        // --- Favorites ---
        '/api/favorites': {
            get: {
                tags: ['Favorites'],
                summary: 'ดึงรายการโปรดของผู้ใช้',
                description: 'รายการอสังหาฯ ทั้งหมดที่ผู้ใช้คนนี้กดบันทึกไว้',
                security: [{ bearerAuth: [] }]
            },
            post: {
                tags: ['Favorites'],
                summary: 'เพิ่มเข้ารายการโปรด',
                description: 'บันทึกทรัพย์ที่สนใจไว้ดูภายหลัง',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { property_id: { type: 'string' } } } } }
                }
            }
        },
        '/api/favorites/{propertyId}': {
            delete: {
                tags: ['Favorites'],
                summary: 'ลบออกจากรายการโปรด',
                description: 'นำทรัพย์ที่บันทึกไว้ออกจากการแจ้งเตือนหรือรายการโปรด',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'propertyId', in: 'path', required: true, schema: { type: 'string' } }]
            }
        },

        // --- Inquiries ---
        '/api/inquiries': {
            get: {
                tags: ['Inquiries'],
                summary: 'ดึงรายการข้อความสอบถาม',
                description: 'ดึงข้อความที่ลูกค้าส่งมาถามข้อมูลเกี่ยวกับทรัพย์ (สำหรับผู้ขาย)',
                security: [{ bearerAuth: [] }]
            },
            post: {
                tags: ['Inquiries'],
                summary: 'ส่งข้อความสอบถาม (Inquiry)',
                description: 'ผู้ซื้อส่งข้อความหาผู้ขายเพื่อสอบถามรายละเอียดเพิ่มเติม',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/InquiryRequest' } } }
                }
            }
        },

        // --- Dashboard & Stats ---
        '/api/dashboard/stats': {
            get: {
                tags: ['Dashboard'],
                summary: 'ดึงข้อมูลสถิติรวม (Admin Only)',
                description: 'สรุปจำนวนผู้ใช้, ผู้ขาย, และประกาศทั้งหมดในระบบ',
                security: [{ bearerAuth: [] }]
            }
        },

        // --- Announcements ---
        '/api/announcements': { 
            get: { 
                tags: ['Announcements'], 
                summary: 'ดึงประกาศ Banner',
                description: 'ดึงข้อมูลประกาศหรือโปรโมชั่นเพื่อแสดงบนหน้าแรกของเว็บ'
            }, 
            post: { 
                tags: ['Announcements'], 
                summary: 'สร้างประกาศใหม่ (Admin Only)', 
                description: 'แอดมินสร้างข่าวสารหรือแบนเนอร์ใหม่',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, type: { type: 'string' } } } } }
                }
            } 
        },

        // --- OTP & Upgrade ---
        '/api/otp/send-email': {
            post: {
                tags: ['OTP & Upgrade'],
                summary: 'ส่ง OTP เข้าอีเมล',
                description: 'ใช้สำหรับส่งรหัส OTP 6 หลักไปยังอีเมลที่ระบุ เพื่อยืนยันตัวตนในการอัปเกรดเป็นผู้ขาย',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', example: 'seller@example.com' } } } } }
                },
                responses: { 
                    200: { description: 'OTP sent successfully' }, 
                    400: { description: 'Email is required' }, 
                    500: { description: 'Server error' } 
                }
            }
        },
        '/api/users/upgrade/{id}': {
            put: {
                tags: ['OTP & Upgrade'],
                summary: 'อัปเกรดเป็นผู้ขาย (Upgrade to Seller)',
                description: 'ยืนยันรหัส OTP เพื่ออัปเกรดบทบาทผู้ใช้เป็นระดับ SELLER',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: { 
                        'application/json': { 
                            schema: { 
                                type: 'object', 
                                required: ['otp', 'email', 'tel', 'realName', 'sellerType'],
                                properties: { 
                                    otp: { type: 'string', example: '123456' }, 
                                    email: { type: 'string', example: 'seller@example.com' }, 
                                    tel: { type: 'string', example: '0812345678' }, 
                                    realName: { type: 'string', example: 'John Doe' }, 
                                    sellerType: { type: 'string', enum: ['OWNER', 'AGENT', 'DEVELOPER'], example: 'OWNER' } 
                                } 
                            } 
                        } 
                    }
                },
                responses: { 
                    200: { description: 'Upgrade successful' }, 
                    400: { description: 'Invalid or expired OTP' },
                    500: { description: 'Server error' }
                }
            }
        }
    }
};

module.exports = swaggerDocument;
