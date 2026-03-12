import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const steps: Record<string, unknown> = {};

  try {
    const { email, password } = await request.json();
    steps.input = { email, password: password ? '***' : 'MISSING' };

    // Step 1: Test prisma query
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { provider: { select: { id: true } } },
      });
      steps.userFound = user ? { id: user.id, name: user.name, role: user.role, hasHash: !!user.password_hash, hashPrefix: user.password_hash?.substring(0, 10) } : null;
    } catch (e) {
      steps.prismaError = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ steps }, { status: 500 });
    }

    // Step 2: Test bcrypt import
    try {
      const bcrypt = await import('bcryptjs');
      steps.bcryptImport = { 
        success: true, 
        hasCompare: typeof bcrypt.compare === 'function',
        hasDefault: typeof bcrypt.default === 'object' || typeof bcrypt.default === 'function',
        keys: Object.keys(bcrypt),
      };
    } catch (e) {
      steps.bcryptImportError = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ steps }, { status: 500 });
    }

    // Step 3: Test bcrypt.compare
    try {
      const bcrypt = await import('bcryptjs');
      const compareFn = bcrypt.compare || (bcrypt.default as typeof bcrypt)?.compare;
      steps.compareFnType = typeof compareFn;
      
      if (typeof compareFn === 'function') {
        // Try comparing with a known hash
        const testHash = await (bcrypt.hash || (bcrypt.default as typeof bcrypt)?.hash)('test', 10);
        steps.testHash = testHash?.substring(0, 10);
        const testResult = await compareFn('test', testHash);
        steps.testCompare = testResult;
      }
    } catch (e) {
      steps.bcryptCompareError = e instanceof Error ? { message: e.message, stack: e.stack?.split('\n').slice(0, 5) } : String(e);
    }

    // Step 4: Test actual login compare
    try {
      const bcrypt = await import('bcryptjs');
      const user = await prisma.user.findUnique({ where: { email } });
      if (user?.password_hash && password) {
        const isValid = await bcrypt.compare(password, user.password_hash);
        steps.loginCompare = isValid;
      }
    } catch (e) {
      steps.loginCompareError = e instanceof Error ? { message: e.message, stack: e.stack?.split('\n').slice(0, 5) } : String(e);
    }

    // Step 5: Test setSession
    try {
      const { createToken } = await import('@/lib/auth');
      const token = await createToken({
        id: 'test',
        email: 'test@test.com',
        name: 'Test',
        role: 'CUSTOMER' as never,
        status: 'ACTIVE' as never,
        providerId: null,
      });
      steps.tokenCreation = { success: true, tokenLength: token.length };
    } catch (e) {
      steps.tokenError = e instanceof Error ? { message: e.message, stack: e.stack?.split('\n').slice(0, 5) } : String(e);
    }

    return NextResponse.json({ steps }, { status: 200 });
  } catch (e) {
    steps.outerError = e instanceof Error ? { message: e.message, stack: e.stack?.split('\n').slice(0, 5) } : String(e);
    return NextResponse.json({ steps }, { status: 500 });
  }
}
