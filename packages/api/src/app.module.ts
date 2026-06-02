import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/datasource';
import { AsyncContextMiddleware } from './common/middleware/async-context.middleware';
import { FirebaseAuthGuard } from './common/guards/firebase-auth.guard';
import { InstanceModule } from './modules/instance/instance.module';
import { CompanyModule } from './modules/company/company.module';
import { UserModule } from './modules/user/user.module';
import { AuthContextInterceptor } from './modules/user/auth-context.interceptor';
import { PacienteModule } from './modules/paciente/paciente.module';
import { PlantillaFichaModule } from './modules/plantilla-ficha/plantilla-ficha.module';
import { FichaPacienteModule } from './modules/ficha-paciente/ficha-paciente.module';
import { VisitaModule } from './modules/visita/visita.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...dataSourceOptions, autoLoadEntities: true }),
    InstanceModule,
    CompanyModule,
    UserModule,
    PacienteModule,
    PlantillaFichaModule,
    FichaPacienteModule,
    VisitaModule,
    AuditoriaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuthContextInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AsyncContextMiddleware).forRoutes('*');
  }
}
