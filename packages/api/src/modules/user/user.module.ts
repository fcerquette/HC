import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuarioCompany } from './entities/usuario-company.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthContextInterceptor } from './auth-context.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, UsuarioCompany])],
  controllers: [UserController],
  providers: [UserService, AuthContextInterceptor],
  exports: [UserService, AuthContextInterceptor],
})
export class UserModule {}
