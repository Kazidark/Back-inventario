import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  getUsers() {
    // return this.userRepository.find({
    //   select: ['id', 'username', 'email', 'role', 'isActive', 'createdAt'],
    //   order: { id: 'ASC' },
    // });
  }
}
