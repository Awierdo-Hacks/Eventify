import { prisma } from '@/lib/prisma';
import type { SessionUser } from '@/lib/auth';

export const DEFAULT_ADMIN_PAGE_SIZE = 25;
export const DEFAULT_BROWSE_PAGE_SIZE = 24;

export interface PageUser {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  providerId: string | null;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BrowseProviderCard {
  id: string;
  businessName: string;
  category: string;
  location: string;
  priceRange: string;
  description: string | null;
  images: string[];
  verified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface BrowseProviderFilters {
  category?: string | null;
  location?: string | null;
  priceRange?: string | null;
  search?: string | null;
  isActive?: string | null;
  page?: number;
  pageSize?: number;
}

function toIso(value: Date | string | null | undefined): string {
  return value ? new Date(value).toISOString() : '';
}

function toNullableIso(value: Date | string | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

function normalizePage(value: number | string | null | undefined, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function normalizePageSize(value: number | string | null | undefined, fallback: number, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export function toPageUser(session: SessionUser): PageUser {
  return {
    id: session.id,
    email: session.email,
    name: session.name,
    role: session.role as PageUser['role'],
    providerId: session.providerId,
  };
}

export async function getUnreadCount(userId: string) {
  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count
    FROM messages m
    INNER JOIN conversation_participants cp
      ON cp.conversation_id = m.conversation_id
      AND cp.user_id = ${userId}
    WHERE m.sender_id != ${userId}
      AND m.created_at > cp.last_read_at
  `;

  return Number(result[0]?.count ?? 0);
}

export async function getServiceRequestsForSession(session: SessionUser, filters: { status?: string | null; providerId?: string | null } = {}) {
  const where: any = {};

  if (session.role === 'CUSTOMER') {
    where.customer_id = session.id;
  } else if (session.role === 'PROVIDER' && session.providerId) {
    where.provider_id = session.providerId;
  } else if (session.role === 'ADMIN') {
    if (filters.providerId) where.provider_id = filters.providerId;
  } else {
    return [];
  }

  if (filters.status) where.status = filters.status;

  const requests = await prisma.serviceRequest.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      provider: {
        select: {
          id: true,
          business_name: true,
          category: true,
          location: true,
          user_id: true,
        },
      },
      quotes: {
        select: {
          id: true,
          total_price: true,
          accepted: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return requests.map((req) => ({
    id: req.id,
    category: req.category,
    eventType: req.event_type,
    eventDate: toIso(req.event_date),
    eventLocation: req.event_location,
    guestCount: req.guest_count,
    budgetRange: req.budget_range,
    description: req.description,
    status: req.status,
    customerName: req.customer_name,
    customerEmail: req.customer_email,
    customerPhone: req.customer_phone,
    preferredContact: req.preferred_contact,
    createdAt: toIso(req.created_at),
    customer: {
      id: req.customer.id,
      name: req.customer.name,
      email: req.customer.email,
      phone: req.customer.phone ?? req.customer_phone,
    },
    provider: req.provider
      ? {
          id: req.provider.id,
          businessName: req.provider.business_name,
          category: req.provider.category,
          location: req.provider.location,
          userId: req.provider.user_id,
        }
      : null,
    quotes: req.quotes.map((quote) => ({
      id: quote.id,
      totalPrice: quote.total_price,
      accepted: quote.accepted,
    })),
  }));
}

export async function getQuotesForSession(session: SessionUser, filters: { requestId?: string | null; status?: string | null } = {}) {
  const where: any = {};

  if (session.role === 'CUSTOMER') {
    where.request = { customer_id: session.id };
    where.rejected_at = null;
  } else if (session.role === 'PROVIDER' && session.providerId) {
    where.provider_id = session.providerId;
  } else if (session.role !== 'ADMIN') {
    return [];
  }

  if (filters.requestId) where.request_id = filters.requestId;
  if (filters.status) where.accepted = filters.status === 'ACCEPTED';

  const quotes = await prisma.quote.findMany({
    where,
    include: {
      provider: {
        select: {
          id: true,
          business_name: true,
          category: true,
          location: true,
          user_id: true,
        },
      },
      request: {
        select: {
          id: true,
          event_type: true,
          event_date: true,
          event_location: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return quotes.map((quote) => ({
    id: quote.id,
    totalPrice: quote.total_price,
    packageName: quote.message || 'Offerte pakket',
    packageDescription: quote.terms || '',
    includedServices: quote.included_services,
    validUntil: toIso(quote.valid_until),
    status: quote.rejected_at ? 'REJECTED' : quote.accepted ? 'ACCEPTED' : 'PENDING',
    createdAt: toIso(quote.created_at),
    rejectedAt: toNullableIso(quote.rejected_at),
    rejectionReason: quote.rejection_reason,
    eventSlotId: quote.event_slot_id,
    provider: {
      id: quote.provider.id,
      businessName: quote.provider.business_name,
      category: quote.provider.category,
      location: quote.provider.location,
      userId: quote.provider.user_id,
    },
    serviceRequest: {
      id: quote.request.id,
      eventType: quote.request.event_type,
      eventDate: toIso(quote.request.event_date),
      eventLocation: quote.request.event_location,
      customer: {
        id: quote.request.customer.id,
        name: quote.request.customer.name,
      },
    },
  }));
}

export async function getBookingsForSession(session: SessionUser, filters: { status?: string | null } = {}) {
  const where: any = {};

  if (session.role === 'CUSTOMER') {
    where.customer_id = session.id;
  } else if (session.role === 'PROVIDER' && session.providerId) {
    where.provider_id = session.providerId;
  } else if (session.role !== 'ADMIN') {
    return [];
  }

  if (filters.status) where.status = filters.status;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      provider: {
        select: {
          id: true,
          business_name: true,
          category: true,
          location: true,
          images: true,
          user_id: true,
        },
      },
      request: {
        select: {
          id: true,
          event_type: true,
          description: true,
          quotes: {
            where: { accepted: true },
            select: {
              id: true,
              total_price: true,
              included_services: true,
              terms: true,
              message: true,
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { event_date: 'desc' },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    eventDate: toIso(booking.event_date),
    eventLocation: booking.event_location,
    guestCount: booking.guest_count,
    finalPrice: booking.final_price,
    status: booking.status,
    paymentStatus: booking.payment_status,
    specialRequests: booking.special_requests,
    createdAt: toIso(booking.created_at),
    customer: {
      id: booking.customer.id,
      name: booking.customer.name,
      email: booking.customer.email,
    },
    provider: {
      id: booking.provider.id,
      businessName: booking.provider.business_name,
      category: booking.provider.category,
      location: booking.provider.location,
      images: booking.provider.images,
      userId: booking.provider.user_id,
    },
    request: {
      id: booking.request.id,
      eventType: booking.request.event_type,
      description: booking.request.description,
    },
    quote: booking.request.quotes[0]
      ? {
          id: booking.request.quotes[0].id,
          packageName: booking.request.quotes[0].message || 'Pakket',
          includedServices: booking.request.quotes[0].included_services,
          terms: booking.request.quotes[0].terms,
        }
      : null,
  }));
}

export async function getEventsForCustomer(customerId: string) {
  const events = await prisma.event.findMany({
    where: {
      customer_id: customerId,
      status: { not: 'CANCELLED' },
    },
    include: {
      slots: {
        include: {
          quotes: {
            select: {
              id: true,
              total_price: true,
              accepted: true,
              message: true,
              included_services: true,
              valid_until: true,
              created_at: true,
              provider: {
                select: {
                  id: true,
                  business_name: true,
                  category: true,
                  location: true,
                },
              },
            },
          },
          booked_quote: {
            select: {
              id: true,
              total_price: true,
              provider: {
                select: {
                  id: true,
                  business_name: true,
                  category: true,
                  location: true,
                },
              },
            },
          },
        },
        orderBy: { display_order: 'asc' },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return events.map((event) => ({
    id: event.id,
    name: event.name,
    eventType: event.event_type,
    eventDate: toNullableIso(event.event_date),
    location: event.location,
    guestCount: event.guest_count,
    budgetMin: event.budget_min,
    budgetMax: event.budget_max,
    status: event.status,
    createdAt: toIso(event.created_at),
    updatedAt: toIso(event.updated_at),
    slots: event.slots.map((slot) => ({
      id: slot.id,
      category: slot.category,
      customName: slot.custom_name,
      isRequired: slot.is_required,
      displayOrder: slot.display_order,
      status: slot.status,
      quotesCount: slot.quotes.length,
      bookedQuote: slot.booked_quote
        ? {
            id: slot.booked_quote.id,
            totalPrice: slot.booked_quote.total_price,
            providerName: slot.booked_quote.provider.business_name,
            provider: {
              id: slot.booked_quote.provider.id,
              businessName: slot.booked_quote.provider.business_name,
              category: slot.booked_quote.provider.category,
              location: slot.booked_quote.provider.location,
            },
          }
        : null,
      quotes: slot.quotes.map((q) => ({
        id: q.id,
        totalPrice: q.total_price,
        accepted: q.accepted,
        providerName: q.provider.business_name,
        message: q.message,
        includedServices: q.included_services,
        validUntil: toIso(q.valid_until),
        createdAt: toIso(q.created_at),
        provider: {
          id: q.provider.id,
          businessName: q.provider.business_name,
          category: q.provider.category,
          location: q.provider.location,
        },
      })),
    })),
  }));
}

export async function getCustomerDashboardData(session: SessionUser) {
  const [requests, quotes, bookings, events, unreadCount] = await Promise.all([
    getServiceRequestsForSession(session),
    getQuotesForSession(session),
    getBookingsForSession(session),
    getEventsForCustomer(session.id),
    getUnreadCount(session.id),
  ]);

  return { requests, quotes, bookings, events, unreadCount };
}

export async function getProviderDashboardData(session: SessionUser) {
  const [requests, quotes, bookings] = await Promise.all([
    getServiceRequestsForSession(session),
    getQuotesForSession(session),
    getBookingsForSession(session),
  ]);

  return { requests, quotes, bookings };
}

export async function getAdminStats() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalProviders,
    verifiedProviders,
    totalBookings,
    totalRevenueResult,
    monthlyRevenueResult,
    recentBookings,
    recentProviders,
    recentUsers,
    recentReviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.serviceProvider.count(),
    prisma.serviceProvider.count({ where: { verified: true } }),
    prisma.booking.count(),
    prisma.booking.aggregate({ _sum: { final_price: true } }),
    prisma.booking.aggregate({
      _sum: { final_price: true },
      where: { created_at: { gte: firstDayOfMonth } },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        customer: { select: { name: true } },
        provider: { select: { business_name: true, category: true } },
      },
    }),
    prisma.serviceProvider.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        business_name: true,
        created_at: true,
        verified: true,
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        role: true,
        created_at: true,
      },
    }),
    prisma.review.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        rating: true,
        created_at: true,
        customer: { select: { name: true } },
        provider: { select: { business_name: true } },
      },
    }),
  ]);

  const pendingProviders = totalProviders - verifiedProviders;
  const totalRevenue = totalRevenueResult._sum.final_price ?? 0;
  const monthlyRevenue = monthlyRevenueResult._sum.final_price ?? 0;

  const recentActivity = [
    ...recentBookings.map((b) => ({
      type: 'booking' as const,
      message: `Nieuwe Boeking: ${b.customer.name} - ${b.provider.business_name}`,
      timestamp: toIso(b.created_at),
    })),
    ...recentProviders.map((p) => ({
      type: p.verified ? ('provider_verified' as const) : ('provider_new' as const),
      message: p.verified
        ? `Provider Geverifieerd: ${p.business_name}`
        : `Nieuwe Provider: ${p.business_name}`,
      timestamp: toIso(p.created_at),
    })),
    ...recentUsers
      .filter((u) => u.role === 'CUSTOMER')
      .map((u) => ({
        type: 'user' as const,
        message: `Nieuwe User: ${u.name}`,
        timestamp: toIso(u.created_at),
      })),
    ...recentReviews.map((r) => ({
      type: 'review' as const,
      message: `Review Ontvangen: ${r.customer.name}`,
      timestamp: toIso(r.created_at),
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return {
    totalUsers,
    totalProviders,
    verifiedProviders,
    pendingProviders,
    totalBookings,
    totalRevenue,
    monthlyRevenue,
    recentActivity,
  };
}

export async function getAdminUsers(params: { page?: number | string | null; pageSize?: number | string | null; role?: string | null; search?: string | null } = {}) {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize, DEFAULT_ADMIN_PAGE_SIZE);
  const skip = (page - 1) * pageSize;
  const search = params.search?.trim();

  const where: any = {};
  if (params.role) where.role = params.role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            business_name: true,
            verified: true,
          },
        },
        _count: {
          select: {
            service_requests: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const items = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: toIso(user.created_at),
    provider: user.provider
      ? {
          id: user.provider.id,
          businessName: user.provider.business_name,
          verified: user.provider.verified,
        }
      : null,
    stats: {
      requests: user._count.service_requests,
      bookings: user._count.bookings,
      reviews: user._count.reviews,
    },
  }));

  return { items, total, page, pageSize, hasMore: skip + items.length < total };
}

export async function getAdminProviders(params: { page?: number | string | null; pageSize?: number | string | null; verified?: string | null; search?: string | null } = {}) {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize, DEFAULT_ADMIN_PAGE_SIZE);
  const skip = (page - 1) * pageSize;
  const search = params.search?.trim();

  const where: any = {};
  if (params.verified === 'false') {
    where.verified = false;
  } else if (params.verified === 'true') {
    where.verified = true;
  }
  if (search) {
    where.OR = [
      { business_name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { user: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const [providers, total] = await Promise.all([
    prisma.serviceProvider.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            service_requests: true,
            quotes: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.serviceProvider.count({ where }),
  ]);

  const items = providers.map((provider) => ({
    id: provider.id,
    businessName: provider.business_name,
    category: provider.category,
    description: provider.description,
    location: provider.location,
    verified: provider.verified,
    isActive: provider.is_active,
    images: provider.images,
    portfolioImages: provider.portfolio_images,
    phone: provider.phone,
    btwNumber: provider.btw_number,
    ratingAvg: provider.rating_avg,
    reviewCount: provider.review_count,
    createdAt: toIso(provider.created_at),
    user: {
      id: provider.user.id,
      name: provider.user.name,
      email: provider.user.email,
    },
    stats: {
      requests: provider._count.service_requests,
      quotes: provider._count.quotes,
      bookings: provider._count.bookings,
      reviews: provider._count.reviews,
    },
  }));

  return { items, total, page, pageSize, hasMore: skip + items.length < total };
}

export async function getBrowseProviders(filters: BrowseProviderFilters = {}): Promise<PaginationResult<BrowseProviderCard>> {
  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize, DEFAULT_BROWSE_PAGE_SIZE);
  const skip = (page - 1) * pageSize;

  const category = filters.category && filters.category !== 'all' ? filters.category : null;
  const location = filters.location && filters.location !== 'all' ? filters.location : null;
  const priceRange = filters.priceRange && filters.priceRange !== 'all' ? filters.priceRange : null;
  const search = filters.search?.trim();

  const where: any = {};
  if (category) where.category = category;
  if (location) {
    where.location = {
      contains: location,
      mode: 'insensitive',
    };
  }
  if (priceRange) where.price_range = priceRange;
  if (search) {
    where.OR = [
      { business_name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (filters.isActive !== 'false') {
    where.verified = true;
    where.is_active = true;
  }

  const [providers, total] = await Promise.all([
    prisma.serviceProvider.findMany({
      where,
      select: {
        id: true,
        business_name: true,
        category: true,
        description: true,
        location: true,
        price_range: true,
        images: true,
        verified: true,
        rating_avg: true,
        review_count: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.serviceProvider.count({ where }),
  ]);

  const items = providers.map((provider) => ({
    id: provider.id,
    businessName: provider.business_name,
    category: provider.category,
    description: provider.description,
    location: provider.location,
    priceRange: provider.price_range,
    images: provider.images.slice(0, 1),
    verified: provider.verified,
    rating: Math.round(provider.rating_avg * 10) / 10,
    reviewCount: provider.review_count,
    createdAt: toIso(provider.created_at),
  }));

  return { items, total, page, pageSize, hasMore: skip + items.length < total };
}
