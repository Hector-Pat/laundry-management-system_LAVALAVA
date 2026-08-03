const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Lava-Lava API',
            version: '1.0.0',
            description:
                'API REST del sistema de gestion de lavanderia Lava-Lava. ' +
                'La autenticacion se hace via cookie httpOnly (`token`) emitida por ' +
                '`POST /api/auth/login`; usa ese endpoint desde "Try it out" para que ' +
                'el navegador guarde la cookie y el resto de peticiones queden autenticadas.'
        },
        servers: [
            {
                url: '/api',
                description: 'Servidor actual'
            }
        ],
        tags: [
            { name: 'Health', description: 'Estado del servicio' },
            { name: 'Auth', description: 'Registro, login y sesion' },
            { name: 'Users', description: 'Gestion de cuentas de personal (solo ADMIN)' },
            { name: 'Clientes', description: 'Directorio de clientes de mostrador' },
            { name: 'Servicios', description: 'Catalogo de servicios de lavanderia' },
            { name: 'Pedidos', description: 'Ordenes de lavanderia y su ciclo de vida' },
            { name: 'Pagos', description: 'Pagos y saldo de un pedido' },
            { name: 'Reclamaciones', description: 'Danos y reclamaciones sobre pedidos' },
            { name: 'Caja', description: 'Corte de caja, reportes y gastos' },
            { name: 'Auditoria', description: 'Bitacora de acciones sensibles (solo ADMIN)' }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                    description:
                        'JWT emitido por /api/auth/login y enviado como cookie httpOnly ' +
                        '`token`. Se adjunta automaticamente por el navegador tras iniciar sesion.'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Mensaje de error' }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        pageSize: { type: 'integer', example: 20 },
                        total: { type: 'integer', example: 57 },
                        totalPages: { type: 'integer', example: 3 }
                    }
                },
                UserRole: {
                    type: 'string',
                    enum: ['ADMIN', 'RECEPCIONISTA', 'OPERADOR', 'CLIENT']
                },
                OrderStatus: {
                    type: 'string',
                    enum: ['RECIBIDO', 'LAVADO', 'SECADO', 'PLANCHADO', 'LISTO', 'ENTREGADO']
                },
                PaymentMethod: {
                    type: 'string',
                    enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']
                },
                PaymentType: {
                    type: 'string',
                    enum: ['CONTADO', 'ADELANTO', 'SALDO']
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        fullName: { type: 'string', example: 'Juana Perez' },
                        email: { type: 'string', format: 'email', example: 'juana@example.com' },
                        phoneNumber: { type: 'string', nullable: true, example: '5512345678' },
                        birthDate: { type: 'string', format: 'date', nullable: true, example: '1990-05-20' },
                        role: { $ref: '#/components/schemas/UserRole' },
                        isActive: { type: 'boolean', example: true }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['fullName', 'email', 'password'],
                    properties: {
                        fullName: { type: 'string', example: 'Juana Perez' },
                        email: { type: 'string', format: 'email', example: 'juana@example.com' },
                        password: { type: 'string', format: 'password', minLength: 6, example: 'secret123' },
                        phoneNumber: { type: 'string', example: '5512345678', description: 'Exactamente 10 digitos' },
                        birthDate: { type: 'string', format: 'date', example: '1990-05-20' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'juana@example.com' },
                        password: { type: 'string', format: 'password', example: 'secret123' }
                    }
                },
                ChangePasswordRequest: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: { type: 'string', format: 'password' },
                        newPassword: { type: 'string', format: 'password', minLength: 6 }
                    }
                },
                CreateUserRequest: {
                    type: 'object',
                    required: ['fullName', 'email', 'password', 'role'],
                    properties: {
                        fullName: { type: 'string', example: 'Carlos Ruiz' },
                        email: { type: 'string', format: 'email', example: 'carlos@example.com' },
                        password: { type: 'string', format: 'password', minLength: 6 },
                        phoneNumber: { type: 'string', example: '5512345678' },
                        birthDate: { type: 'string', format: 'date' },
                        role: { $ref: '#/components/schemas/UserRole' }
                    }
                },
                UpdateUserRequest: {
                    type: 'object',
                    description: 'Todos los campos son opcionales; se envia solo lo que cambia.',
                    properties: {
                        role: { $ref: '#/components/schemas/UserRole' },
                        isActive: { type: 'boolean' },
                        password: { type: 'string', format: 'password', minLength: 6 }
                    }
                },
                Cliente: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        fullName: { type: 'string', example: 'Maria Lopez' },
                        phoneNumber: { type: 'string', example: '5512345678' },
                        email: { type: 'string', format: 'email', nullable: true, example: 'maria@example.com' }
                    }
                },
                CreateClienteRequest: {
                    type: 'object',
                    required: ['fullName', 'phoneNumber'],
                    properties: {
                        fullName: { type: 'string', example: 'Maria Lopez' },
                        phoneNumber: { type: 'string', example: '5512345678', description: 'Exactamente 10 digitos' },
                        email: { type: 'string', format: 'email', example: 'maria@example.com' }
                    }
                },
                UpdateClienteRequest: {
                    type: 'object',
                    description: 'Todos los campos son opcionales; se envia solo lo que cambia.',
                    properties: {
                        fullName: { type: 'string' },
                        phoneNumber: { type: 'string', description: 'Exactamente 10 digitos' },
                        email: { type: 'string', format: 'email', nullable: true }
                    }
                },
                Servicio: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Lavado de edredon' },
                        price: { type: 'number', format: 'float', example: 120.5 },
                        isActive: { type: 'boolean', example: true }
                    }
                },
                CreateServicioRequest: {
                    type: 'object',
                    required: ['name', 'price'],
                    properties: {
                        name: { type: 'string', example: 'Lavado de edredon' },
                        price: { type: 'number', format: 'float', example: 120.5 }
                    }
                },
                UpdateServicioRequest: {
                    type: 'object',
                    description: 'Todos los campos son opcionales; se envia solo lo que cambia.',
                    properties: {
                        name: { type: 'string' },
                        price: { type: 'number', format: 'float' },
                        isActive: { type: 'boolean' }
                    }
                },
                PedidoItem: {
                    type: 'object',
                    properties: {
                        servicioId: { type: 'integer', example: 1 },
                        servicioName: { type: 'string', example: 'Lavado de edredon' },
                        quantity: { type: 'integer', example: 2 },
                        unitPrice: { type: 'number', format: 'float', example: 120.5 },
                        subtotal: { type: 'number', format: 'float', example: 241 }
                    }
                },
                Pedido: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 10 },
                        folio: { type: 'string', example: 'PED-000010' },
                        status: { $ref: '#/components/schemas/OrderStatus' },
                        total: { type: 'number', format: 'float', example: 241 },
                        cliente: { $ref: '#/components/schemas/Cliente' },
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/PedidoItem' }
                        },
                        cancelledAt: { type: 'string', format: 'date-time', nullable: true },
                        cancelReason: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        qrCode: {
                            type: 'string',
                            description: 'Imagen PNG del QR del folio, codificada como data URL.',
                            example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
                        }
                    }
                },
                CreatePedidoRequest: {
                    type: 'object',
                    required: ['cliente', 'items'],
                    properties: {
                        cliente: {
                            oneOf: [
                                {
                                    type: 'object',
                                    required: ['id'],
                                    properties: { id: { type: 'integer', example: 1 } },
                                    description: 'Referencia a un cliente existente'
                                },
                                {
                                    type: 'object',
                                    required: ['fullName', 'phoneNumber'],
                                    properties: {
                                        fullName: { type: 'string', example: 'Maria Lopez' },
                                        phoneNumber: { type: 'string', example: '5512345678' },
                                        email: { type: 'string', format: 'email', example: 'maria@example.com' }
                                    },
                                    description: 'Datos para dar de alta un cliente nuevo al vuelo'
                                }
                            ]
                        },
                        items: {
                            type: 'array',
                            minItems: 1,
                            items: {
                                type: 'object',
                                required: ['servicioId', 'quantity'],
                                properties: {
                                    servicioId: { type: 'integer', example: 1 },
                                    quantity: { type: 'integer', minimum: 1, example: 2 }
                                }
                            }
                        }
                    }
                },
                UpdatePedidoItemsRequest: {
                    type: 'object',
                    required: ['items'],
                    properties: {
                        items: {
                            type: 'array',
                            minItems: 1,
                            items: {
                                type: 'object',
                                required: ['servicioId', 'quantity'],
                                properties: {
                                    servicioId: { type: 'integer', example: 1 },
                                    quantity: { type: 'integer', minimum: 1, example: 2 }
                                }
                            }
                        }
                    }
                },
                UpdatePedidoStatusRequest: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: { $ref: '#/components/schemas/OrderStatus' }
                    }
                },
                CancelPedidoRequest: {
                    type: 'object',
                    required: ['reason'],
                    properties: {
                        reason: { type: 'string', example: 'El cliente cancelo el servicio' }
                    }
                },
                Pago: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 5 },
                        pedidoId: { type: 'integer', example: 10 },
                        amount: { type: 'number', format: 'float', example: 100 },
                        method: { $ref: '#/components/schemas/PaymentMethod' },
                        type: { $ref: '#/components/schemas/PaymentType' },
                        isVoided: { type: 'boolean', example: false },
                        voidReason: { type: 'string', nullable: true },
                        registeredBy: { type: 'integer', example: 2 },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                PaymentSummary: {
                    type: 'object',
                    properties: {
                        pedidoId: { type: 'integer', example: 10 },
                        total: { type: 'number', format: 'float', example: 241 },
                        totalPagado: { type: 'number', format: 'float', example: 100 },
                        saldoPendiente: { type: 'number', format: 'float', example: 141 },
                        pagos: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Pago' }
                        }
                    }
                },
                CreatePagoRequest: {
                    type: 'object',
                    required: ['amount'],
                    properties: {
                        amount: { type: 'number', format: 'float', minimum: 0.01, example: 100 },
                        method: { $ref: '#/components/schemas/PaymentMethod' }
                    }
                },
                VoidPagoRequest: {
                    type: 'object',
                    required: ['reason'],
                    properties: {
                        reason: { type: 'string', example: 'Pago duplicado por error de captura' }
                    }
                },
                Reclamacion: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 3 },
                        pedidoId: { type: 'integer', example: 10 },
                        clienteId: { type: 'integer', example: 1 },
                        description: { type: 'string', example: 'Prenda con mancha despues del lavado' },
                        status: { type: 'string', enum: ['ABIERTA', 'RESUELTA'], example: 'ABIERTA' },
                        resolutionNotes: { type: 'string', nullable: true },
                        registeredBy: { type: 'integer', example: 2 },
                        resolvedBy: { type: 'integer', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        resolvedAt: { type: 'string', format: 'date-time', nullable: true }
                    }
                },
                CreateReclamacionRequest: {
                    type: 'object',
                    required: ['description'],
                    properties: {
                        description: { type: 'string', example: 'Prenda con mancha despues del lavado' }
                    }
                },
                ResolveReclamacionRequest: {
                    type: 'object',
                    required: ['resolutionNotes'],
                    properties: {
                        resolutionNotes: { type: 'string', example: 'Se aplico descuento del 20% como compensacion' }
                    }
                },
                Gasto: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 4 },
                        concept: { type: 'string', example: 'Compra de detergente' },
                        amount: { type: 'number', format: 'float', example: 350 },
                        registeredBy: { type: 'integer', example: 2 },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateGastoRequest: {
                    type: 'object',
                    required: ['concept', 'amount'],
                    properties: {
                        concept: { type: 'string', example: 'Compra de detergente' },
                        amount: { type: 'number', format: 'float', minimum: 0.01, example: 350 }
                    }
                },
                CorteCaja: {
                    type: 'object',
                    properties: {
                        date: { type: 'string', format: 'date', nullable: true },
                        ingresos: { type: 'number', format: 'float', example: 1500 },
                        egresos: { type: 'number', format: 'float', example: 350 },
                        total: { type: 'number', format: 'float', example: 1150 },
                        pagos: { type: 'array', items: { $ref: '#/components/schemas/Pago' } },
                        gastos: { type: 'array', items: { $ref: '#/components/schemas/Gasto' } }
                    }
                },
                ReporteCaja: {
                    type: 'object',
                    properties: {
                        from: { type: 'string', format: 'date' },
                        to: { type: 'string', format: 'date' },
                        dias: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    date: { type: 'string', format: 'date' },
                                    ingresos: { type: 'number', format: 'float' },
                                    egresos: { type: 'number', format: 'float' },
                                    total: { type: 'number', format: 'float' }
                                }
                            }
                        },
                        totales: {
                            type: 'object',
                            properties: {
                                ingresos: { type: 'number', format: 'float' },
                                egresos: { type: 'number', format: 'float' },
                                total: { type: 'number', format: 'float' }
                            }
                        }
                    }
                },
                AuditLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 7 },
                        userId: { type: 'integer', example: 1 },
                        action: { type: 'string', example: 'FORZAR_ESTADO_PEDIDO' },
                        entityType: { type: 'string', example: 'pedido' },
                        entityId: { type: 'integer', example: 10 },
                        details: { type: 'object', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                }
            },
            parameters: {
                UserId: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'ID del usuario',
                    schema: { type: 'integer', example: 1 }
                },
                ClienteId: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'ID del cliente',
                    schema: { type: 'integer', example: 1 }
                },
                ServicioId: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'ID del servicio',
                    schema: { type: 'integer', example: 1 }
                },
                PedidoId: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'ID del pedido',
                    schema: { type: 'integer', example: 10 }
                },
                PagoId: {
                    name: 'pagoId',
                    in: 'path',
                    required: true,
                    description: 'ID del pago',
                    schema: { type: 'integer', example: 5 }
                },
                ReclamacionId: {
                    name: 'reclamacionId',
                    in: 'path',
                    required: true,
                    description: 'ID de la reclamacion',
                    schema: { type: 'integer', example: 3 }
                },
                PageParam: {
                    name: 'page',
                    in: 'query',
                    description: 'Numero de pagina (por defecto 1)',
                    schema: { type: 'integer', minimum: 1, default: 1 }
                },
                PageSizeParam: {
                    name: 'pageSize',
                    in: 'query',
                    description: 'Tamano de pagina (maximo 100, por defecto 20)',
                    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                }
            },
            responses: {
                BadRequest: {
                    description: 'Solicitud invalida (datos faltantes o con formato incorrecto)',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                Unauthorized: {
                    description: 'No autenticado (falta o es invalida la cookie de sesion)',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                Forbidden: {
                    description: 'Autenticado pero sin permisos para este recurso',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                NotFound: {
                    description: 'El recurso solicitado no existe',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                },
                Conflict: {
                    description: 'Conflicto con el estado actual del recurso (por ejemplo, ya existe)',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
                }
            }
        },
        security: [{ cookieAuth: [] }]
    },
    apis: ['./src/modules/**/*.routes.js', './src/app.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
