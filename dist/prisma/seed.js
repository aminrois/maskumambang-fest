"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Memulai proses seeding data master ke PostgreSQL (Idempotent)...');
    console.log('👤 Seeding default users...');
    const saltRounds = 12;
    const defaultUsers = [
        {
            name: 'Super Administrator',
            email: 'admin@lomba.id',
            phoneNumber: '081234567890',
            password: 'admin123',
            role: client_1.Role.SUPER_ADMIN,
        },
        {
            name: 'Bendahara Panitia',
            email: 'bendahara@lomba.id',
            phoneNumber: '081234567891',
            password: 'bendahara123',
            role: client_1.Role.BENDAHARA,
        },
        {
            name: 'Ahmad Fauzi (Peserta Demo)',
            email: 'peserta@lomba.id',
            phoneNumber: '081234567892',
            password: 'peserta123',
            role: client_1.Role.PESERTA,
        },
    ];
    for (const u of defaultUsers) {
        const passwordHash = await bcrypt.hash(u.password, saltRounds);
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                name: u.name,
                phoneNumber: u.phoneNumber,
                role: u.role,
                isActive: true,
            },
            create: {
                name: u.name,
                email: u.email,
                phoneNumber: u.phoneNumber,
                passwordHash,
                role: u.role,
                isActive: true,
            },
        });
    }
    console.log(`✅ ${defaultUsers.length} Default users seeded successfully.`);
    console.log('💳 Seeding official payment accounts...');
    const paymentAccounts = [
        {
            bankName: 'Bank Central Asia (BCA)',
            accountNumber: '8830123456',
            accountHolder: 'Panitia Lomba Nasional 2026',
        },
        {
            bankName: 'Bank Mandiri',
            accountNumber: '1420019283746',
            accountHolder: 'Panitia Lomba Nasional 2026',
        },
        {
            bankName: 'Bank Syariah Indonesia (BSI)',
            accountNumber: '7123456789',
            accountHolder: 'Panitia Lomba Nasional 2026',
        },
        {
            bankName: 'Bank Rakyat Indonesia (BRI)',
            accountNumber: '001901002345501',
            accountHolder: 'Panitia Lomba Nasional 2026',
        },
    ];
    for (const acc of paymentAccounts) {
        const existing = await prisma.paymentAccount.findFirst({
            where: { accountNumber: acc.accountNumber },
        });
        if (existing) {
            await prisma.paymentAccount.update({
                where: { id: existing.id },
                data: {
                    bankName: acc.bankName,
                    accountHolder: acc.accountHolder,
                    isActive: true,
                },
            });
        }
        else {
            await prisma.paymentAccount.create({
                data: {
                    bankName: acc.bankName,
                    accountNumber: acc.accountNumber,
                    accountHolder: acc.accountHolder,
                    isActive: true,
                },
            });
        }
    }
    console.log(`✅ ${paymentAccounts.length} Official payment accounts seeded.`);
    console.log('⚙️ Seeding application branding settings...');
    const defaultSettings = [
        {
            key: 'application_name',
            value: 'MASKUMAMBANG FEST #4',
        },
        {
            key: 'application_short_name',
            value: 'MASKUMAMBANG FEST #4',
        },
        {
            key: 'application_description',
            value: 'Ajang Kompetisi Tingkat Nasional Paling Bergengsi Tahun 2026.',
        },
        {
            key: 'application_logo',
            value: 'logo_e7a8b6a95d.webp',
        },
        {
            key: 'application_favicon',
            value: 'favicon_87007b6344.webp',
        },
    ];
    for (const s of defaultSettings) {
        await prisma.appSetting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value },
        });
    }
    console.log(`✅ ${defaultSettings.length} App settings seeded.`);
    console.log('🏆 Seeding competition categories, levels, and branches...');
    const competitionTree = [
        {
            name: 'Olympiad Nasional',
            slug: 'olympiad-nasional',
            description: 'Kompetisi akademik sains, matematika, keagamaan, dan bahasa tingkat nasional.',
            levels: [
                {
                    name: 'SD/MI',
                    slug: 'sd-mi',
                    branches: [
                        { name: 'Matematika', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'PAI', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'Sains', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'Bahasa Inggris', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'Bahasa Arab', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                    ],
                },
                {
                    name: 'SMP/MTs',
                    slug: 'smp-mts',
                    branches: [
                        { name: 'Matematika', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'PAI', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'Sains', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'IPS', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'Bahasa Inggris', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'Bahasa Arab', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                    ],
                },
            ],
        },
        {
            name: 'Little Champions',
            slug: 'little-champions',
            description: 'Ajang kreativitas dan ketangkasan anak usia dini.',
            levels: [
                {
                    name: 'TK/RA Kelas A & B',
                    slug: 'tk-ra-ab',
                    branches: [
                        { name: 'Mewarnai', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'Kolase', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                        { name: 'Kids Warrior', type: client_1.ParticipantType.INDIVIDUAL, fee: 150000, minM: null, maxM: null },
                    ],
                },
            ],
        },
        {
            name: 'Sport',
            slug: 'sport',
            description: 'Kejuaraan olahraga beregu untuk melatih sportivitas dan kerjasama.',
            levels: [
                {
                    name: 'SD/MI',
                    slug: 'sd-mi',
                    branches: [
                        { name: 'Futsal', type: client_1.ParticipantType.TEAM, fee: 150000, minM: 5, maxM: 10 },
                    ],
                },
                {
                    name: 'SMP/MTs',
                    slug: 'smp-mts',
                    branches: [
                        { name: 'Futsal', type: client_1.ParticipantType.TEAM, fee: 150000, minM: 5, maxM: 10 },
                        { name: 'Bola Voli', type: client_1.ParticipantType.TEAM, fee: 150000, minM: 6, maxM: 12 },
                    ],
                },
            ],
        },
        {
            name: 'Master Chef',
            slug: 'master-chef',
            description: 'Kompetisi kreasi memasak dan penyajian hidangan nusantara bergengsi.',
            levels: [
                {
                    name: 'SD/MI',
                    slug: 'sd-mi',
                    branches: [
                        { name: 'Master Chef', type: client_1.ParticipantType.TEAM, fee: 150000, minM: 2, maxM: 3 },
                    ],
                },
                {
                    name: 'SMP/MTs',
                    slug: 'smp-mts',
                    branches: [
                        { name: 'Master Chef', type: client_1.ParticipantType.TEAM, fee: 150000, minM: 2, maxM: 3 },
                    ],
                },
            ],
        },
        {
            name: 'Robotik',
            slug: 'robotik',
            description: 'Kompetisi rekayasa robotika, pemrograman mikro-kontroler dan inovasi teknologi.',
            levels: [
                {
                    name: 'SD/MI',
                    slug: 'sd-mi',
                    branches: [
                        { name: 'Grasshopper', type: client_1.ParticipantType.TEAM, fee: 150000, minM: 2, maxM: 4 },
                    ],
                },
                {
                    name: 'SD/SMP/SMA',
                    slug: 'sd-smp-sma',
                    branches: [
                        { name: 'Soccer', type: client_1.ParticipantType.TEAM, fee: 150000, minM: 2, maxM: 4 },
                        { name: 'Creative', type: client_1.ParticipantType.TEAM, fee: 150000, minM: 2, maxM: 4 },
                    ],
                },
            ],
        },
    ];
    let totalCategories = 0;
    let totalLevels = 0;
    let totalBranches = 0;
    for (const cat of competitionTree) {
        const category = await prisma.competitionCategory.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                description: cat.description,
                isActive: true,
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                isActive: true,
            },
        });
        totalCategories++;
        for (const lvl of cat.levels) {
            const level = await prisma.competitionLevel.upsert({
                where: {
                    categoryId_name: {
                        categoryId: category.id,
                        name: lvl.name,
                    },
                },
                update: {
                    slug: lvl.slug,
                },
                create: {
                    categoryId: category.id,
                    name: lvl.name,
                    slug: lvl.slug,
                },
            });
            totalLevels++;
            for (const br of lvl.branches) {
                await prisma.competitionBranch.upsert({
                    where: {
                        levelId_name: {
                            levelId: level.id,
                            name: br.name,
                        },
                    },
                    update: {
                        participantType: br.type,
                        registrationFee: br.fee,
                        minTeamMembers: br.minM,
                        maxTeamMembers: br.maxM,
                        description: `Lomba ${br.name} jenjang ${lvl.name}`,
                        isActive: true,
                    },
                    create: {
                        levelId: level.id,
                        name: br.name,
                        participantType: br.type,
                        registrationFee: br.fee,
                        minTeamMembers: br.minM,
                        maxTeamMembers: br.maxM,
                        description: `Lomba ${br.name} jenjang ${lvl.name}`,
                        isActive: true,
                    },
                });
                totalBranches++;
            }
        }
    }
    console.log(`✅ Seeded ${totalCategories} Categories, ${totalLevels} Levels, and ${totalBranches} Branches.`);
    console.log('🧪 Seeding Phase C testing dataset for pagination, search, and workflow audits...');
    const testUsersData = [
        { name: 'Ahmad Dahlan', email: 'test.peserta01@lomba.id', phone: '081234567801' },
        { name: 'Budi Santoso', email: 'test.peserta02@lomba.id', phone: '081234567802' },
        { name: 'Citra Kirana', email: 'test.peserta03@lomba.id', phone: '081234567803' },
        { name: 'Dewi Sartika', email: 'test.peserta04@lomba.id', phone: '081234567804' },
        { name: 'Eko Prasetyo', email: 'test.peserta05@lomba.id', phone: '081234567805' },
        { name: 'Fajar Nugraha', email: 'test.peserta06@lomba.id', phone: '081234567806' },
        { name: 'Gita Gutawa', email: 'test.peserta07@lomba.id', phone: '081234567807' },
        { name: 'Hadi Pranoto', email: 'test.peserta08@lomba.id', phone: '081234567808' },
        { name: 'Indah Permata', email: 'test.peserta09@lomba.id', phone: '081234567809' },
        { name: 'Joko Widodo', email: 'test.peserta10@lomba.id', phone: '081234567810' },
        { name: 'Kartika Sari', email: 'test.peserta11@lomba.id', phone: '081234567811' },
        { name: 'Lukman Hakim', email: 'test.peserta12@lomba.id', phone: '081234567812' },
    ];
    const allBranches = await prisma.competitionBranch.findMany({
        include: { level: { include: { category: true } } },
    });
    const firstAccount = await prisma.paymentAccount.findFirst();
    const bendaharaUser = await prisma.user.findUnique({ where: { email: 'bendahara@lomba.id' } });
    for (let i = 0; i < testUsersData.length; i++) {
        const tu = testUsersData[i];
        const passwordHash = await bcrypt.hash('password123', 10);
        const user = await prisma.user.upsert({
            where: { email: tu.email },
            update: { name: tu.name, phoneNumber: tu.phone, role: client_1.Role.PESERTA, isActive: true },
            create: { name: tu.name, email: tu.email, phoneNumber: tu.phone, passwordHash, role: client_1.Role.PESERTA, isActive: true },
        });
        const branch = allBranches[i % allBranches.length];
        const regNum = `REG-${branch.participantType === client_1.ParticipantType.INDIVIDUAL ? 'IND' : 'TIM'}-2026-TEST${String(i + 1).padStart(2, '0')}`;
        const qrToken = `QR-${regNum}-${tu.phone}`;
        let regStatus = client_1.RegistrationStatus.WAITING_VERIFICATION;
        let payStatus = client_1.PaymentStatus.WAITING_VERIFICATION;
        if (i % 4 === 0 || i % 4 === 1) {
            regStatus = client_1.RegistrationStatus.APPROVED;
            payStatus = client_1.PaymentStatus.APPROVED;
        }
        else if (i % 4 === 3) {
            regStatus = client_1.RegistrationStatus.PAYMENT_REJECTED;
            payStatus = client_1.PaymentStatus.REJECTED;
        }
        const reg = await prisma.registration.upsert({
            where: { registrationNumber: regNum },
            update: { status: regStatus },
            create: {
                registrationNumber: regNum,
                qrCodeToken: qrToken,
                userId: user.id,
                branchId: branch.id,
                status: regStatus,
            },
        });
        if (branch.participantType === client_1.ParticipantType.INDIVIDUAL) {
            await prisma.individualParticipant.upsert({
                where: { registrationId: reg.id },
                update: { fullName: tu.name, schoolName: `SD/SMP Negeri ${i + 1} Gresik` },
                create: {
                    registrationId: reg.id,
                    fullName: tu.name,
                    gender: i % 2 === 0 ? client_1.Gender.L : client_1.Gender.P,
                    gradeClass: 'Kelas 5 SD',
                    schoolName: `SD/SMP Negeri ${i + 1} Gresik`,
                    schoolAddress: 'Jl. Raya Pendidikan No. ' + (i + 1) + ' Gresik',
                    mentorName: 'Ustadz Pembina ' + (i + 1),
                    whatsappNumber: tu.phone,
                },
            });
        }
        else {
            const team = await prisma.team.upsert({
                where: { registrationId: reg.id },
                update: { teamName: `Tim ${tu.name} Squad` },
                create: {
                    registrationId: reg.id,
                    teamName: `Tim ${tu.name} Squad`,
                    schoolName: `SMP/MTs Negeri ${i + 1} Gresik`,
                    schoolAddress: 'Jl. Pemuda No. ' + (i + 1) + ' Gresik',
                    mentorName: 'Ustadz Pelatih ' + (i + 1),
                    whatsappNumber: tu.phone,
                    leaderName: tu.name,
                },
            });
            await prisma.teamMember.deleteMany({ where: { teamId: team.id } });
            await prisma.teamMember.createMany({
                data: [
                    { teamId: team.id, memberName: `Anggota 1 (${tu.name})`, gender: client_1.Gender.L, gradeClass: 'Kelas 8' },
                    { teamId: team.id, memberName: `Anggota 2 (${tu.name})`, gender: client_1.Gender.P, gradeClass: 'Kelas 8' },
                ],
            });
        }
        if (firstAccount) {
            const existingPay = await prisma.payment.findFirst({ where: { registrationId: reg.id } });
            let paymentId = existingPay?.id;
            if (!existingPay) {
                const p = await prisma.payment.create({
                    data: {
                        registrationId: reg.id,
                        paymentAccountId: firstAccount.id,
                        amount: branch.registrationFee,
                        proofImagePath: 'sample_proof.png',
                        senderBank: 'BCA',
                        senderAccountName: tu.name,
                        paymentDate: new Date(),
                        status: payStatus,
                        notes: regStatus === client_1.RegistrationStatus.PAYMENT_REJECTED ? 'Nominal kurang Rp 20.000' : 'Testing Payment',
                    },
                });
                paymentId = p.id;
            }
            if (paymentId && bendaharaUser && payStatus !== client_1.PaymentStatus.WAITING_VERIFICATION) {
                await prisma.paymentVerificationLog.create({
                    data: {
                        paymentId,
                        verifiedByUserId: bendaharaUser.id,
                        action: payStatus === client_1.PaymentStatus.APPROVED ? 'APPROVED' : 'REJECTED',
                        rejectionReason: payStatus === client_1.PaymentStatus.REJECTED ? 'Nominal transfer tidak sesuai dengan biaya cabang lomba (kurang Rp 20.000).' : undefined,
                    },
                });
            }
        }
        if (i % 4 === 0 && bendaharaUser && regStatus === client_1.RegistrationStatus.APPROVED) {
            await prisma.checkIn.upsert({
                where: { registrationId: reg.id },
                update: {},
                create: {
                    registrationId: reg.id,
                    checkedInByUserId: bendaharaUser.id,
                    checkInMethod: 'QR_SCAN',
                    checkInTime: new Date(),
                },
            });
        }
    }
    console.log(`✅ Seeded ${testUsersData.length} test users, registrations, payments, and check-ins.`);
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map