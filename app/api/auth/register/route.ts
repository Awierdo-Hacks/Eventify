import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole, PriceRange } from '@/generated/prisma/client';
import { setSession } from '@/lib/auth';

// Map price range string to PriceRange enum
function mapPriceRange(range: string): PriceRange {
  const map: Record<string, PriceRange> = {
    '€': 'LOW',
    '€€': 'MEDIUM',
    '€€€': 'HIGH',
    '€€€€': 'PREMIUM',
  };
  return map[range] || 'MEDIUM';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountType } = body;

    // Valideer account type
    if (!accountType || !['CUSTOMER', 'PROVIDER'].includes(accountType)) {
      return NextResponse.json(
        { error: 'Ongeldig account type' },
        { status: 400 }
      );
    }

    // Determine email field
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'E-mailadres is verplicht' },
        { status: 400 }
      );
    }

    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 8 karakters zijn' },
        { status: 400 }
      );
    }

    // Check of email al bestaat
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Er bestaat al een account met dit e-mailadres' },
        { status: 400 }
      );
    }

    // Hash wachtwoord
    const hashedPassword = await bcrypt.hash(body.password, 10);

    if (accountType === 'CUSTOMER') {
      // === KLANT REGISTRATIE ===
      const { firstName, lastName, dateOfBirth } = body;

      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: 'Voornaam en achternaam zijn verplicht' },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          password_hash: hashedPassword,
          role: UserRole.CUSTOMER,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
      });

      // Auto-login: set session cookie
      await setSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        providerId: null,
      });

      return NextResponse.json(
        {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 201 }
      );

    } else {
      // === PROVIDER REGISTRATIE ===
      const {
        businessName,
        category,
        description,
        location,
        priceRange,
        contactName,
        phone,
        profileImage,
        portfolioImages,
        services,
      } = body;

      // Validaties
      if (!businessName || !category || !location || !contactName) {
        return NextResponse.json(
          { error: 'Alle bedrijfsvelden zijn verplicht' },
          { status: 400 }
        );
      }

      if (!description || description.length < 50) {
        return NextResponse.json(
          { error: 'Beschrijving moet minimaal 50 karakters zijn' },
          { status: 400 }
        );
      }

      // Transactie: User + ServiceProvider + ProviderServices
      const result = await prisma.$transaction(async (tx) => {
        // 1. Maak User aan
        const user = await tx.user.create({
          data: {
            email,
            name: contactName,
            password_hash: hashedPassword,
            role: UserRole.PROVIDER,
            phone: phone || null,
          },
        });

        // 2. Maak ServiceProvider profiel aan
        const allImages = profileImage
          ? [profileImage, ...(portfolioImages || [])]
          : portfolioImages || [];

        const provider = await tx.serviceProvider.create({
          data: {
            user_id: user.id,
            business_name: businessName,
            category,
            location,
            price_range: mapPriceRange(priceRange || '€€'),
            description,
            images: allImages,
            portfolio_images: portfolioImages || [],
            phone: phone || null,
            services: services?.map((s: { name: string }) => s.name) || [],
          },
        });

        // 3. Maak ProviderService records aan
        if (services && services.length > 0) {
          await tx.providerService.createMany({
            data: services.map(
              (service: {
                name: string;
                description?: string;
                priceFrom: number;
                priceTo?: number;
              }) => ({
                provider_id: provider.id,
                name: service.name,
                description: service.description || null,
                price_from: service.priceFrom,
                price_to: service.priceTo || null,
              })
            ),
          });
        }

        return { user, provider };
      });

      // Auto-login: set session cookie
      await setSession({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        status: result.user.status,
        providerId: result.provider.id,
      });

      return NextResponse.json(
        {
          success: true,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            providerId: result.provider.id,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij de registratie' },
      { status: 500 }
    );
  }
}
