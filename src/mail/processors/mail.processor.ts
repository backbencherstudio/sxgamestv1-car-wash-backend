import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import appConfig from '../../config/app.config';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  constructor(private mailerService: MailerService) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} with name ${job.name} completed`);
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} with name ${job.name}`);
    try {
      switch (job.name) {
        case 'sendMemberInvitation':
          this.logger.log('Sending member invitation email');
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;
        case 'sendOtpCodeToEmail':
          this.logger.log('Sending OTP code to email');
          try {
            await this.mailerService.sendMail({
              to: job.data.to,
              from: job.data.from,
              subject: job.data.subject,
              template: job.data.template,
              context: job.data.context,
            });
            this.logger.log(`Successfully sent OTP email to ${job.data.to}`);
          } catch (emailError) {
            this.logger.error(`Failed to send OTP email to ${job.data.to}:`, {
              error: emailError.message,
              stack: emailError.stack,
              jobData: job.data,
              smtpConfig: {
                host: appConfig().mail.host,
                port: appConfig().mail.port,
                user: appConfig().mail.user ? '***' : 'not set'
              }
            });
            throw emailError;
          }
          break;

        default:
          this.logger.log('Unknown job name');
          return;
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} with name ${job.name}`,
        error,
      );
      throw error;
    }
  }
}
