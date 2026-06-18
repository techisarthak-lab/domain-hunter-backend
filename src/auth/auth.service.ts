import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(data: any) {
    const existingUser = await this.usersService.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const role = data.email.toLowerCase() === 'akash@bynext.com' ? 'ADMIN' : (data.role || 'BUYER');
    
    const user = await this.usersService.create({
      email: data.email,
      passwordHash: hashedPassword,
      fullName: data.fullName,
      role: role,
    });

    // Remove passwordHash before returning
    const { passwordHash, ...result } = user;
    
    // Admin Notification Logic
    console.log(`[EMAIL NOTIFICATION SENT TO ADMIN: akash@bynext.com] -> NEW USER SIGN UP: ${data.email} (${role})`);

    return result;
  }

  async login(user: any) {
    const userRecord = await this.usersService.findOne({ email: user.email });
    if (!userRecord) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(user.password, userRecord.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Admin Notification Logic
    console.log(`[EMAIL NOTIFICATION SENT TO ADMIN: akash@bynext.com] -> USER LOGGED IN: ${userRecord.email}`);

    const payload = { email: userRecord.email, sub: userRecord.id, role: userRecord.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.fullName,
        role: userRecord.role,
      }
    };
  }
}
