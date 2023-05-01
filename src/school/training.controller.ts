import { Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './subject.entity';
import { Teacher } from './teacher.entity';
import { User } from 'src/auth/user.entity';
import { Profile } from 'src/auth/profile.entity';

@Controller('school')
export class TrainingController {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  @Post('/create')
  public async savingRelation() {
    /**
     * 插入数据
     */
    // const subject = new Subject();
    // subject.name = 'Math';
    // const teacher1 = new Teacher();
    // const teacher2 = new Teacher();
    // teacher1.name = 'John Doe';
    // teacher2.name = 'Harry Doe';
    // subject.teachers = [teacher1, teacher2];
    // console.log(
    //   '🚀 ~ file: training.controller.ts:28 ~ TrainingController ~ savingRelation ~ subject:',
    //   subject,
    // );
    // const result = await this.subjectRepository.save(subject);
    // console.log(
    //   '🚀 ~ file: training.controller.ts:33 ~ TrainingController ~ savingRelation ~ result:',
    //   result,
    // );
    // return result;
    /**
     * 插入数据
     * 性能优化
     */
    const subject = new Subject();
    subject.name = 'Math';
    await this.subjectRepository.save(subject);
    const teacher1 = new Teacher();
    const teacher2 = new Teacher();
    teacher1.name = 'John Doe';
    teacher2.name = 'Harry Doe';
    subject.teachers = [teacher1, teacher2];
    return await this.teacherRepository.save([teacher1, teacher2]);
    /**
     * 更新关联关系
     * many to many
     */
    // const subject = await this.subjectRepository.findOne({
    //   where: { id: 3 },
    // });
    // const teacher1 = await this.teacherRepository.findOne({
    //   where: { id: 4 },
    // });
    // const teacher2 = await this.teacherRepository.findOne({
    //   where: { id: 5 },
    // });
    // return await this.subjectRepository
    //   .createQueryBuilder()
    //   .relation(Subject, 'teachers')
    //   .of(subject)
    //   .add([teacher1, teacher2]);
    // const subject = await this.subjectRepository.findOne({
    //   where: {
    //     id: 3,
    //   },
    // });
    // How to use One to One
    // const user = new User();
    // const profile = new Profile();
    // user.profile = profile;
    // user.profile = null;
    // Save the user here
  }

  @Post('/remove')
  public async removingRelation() {
    const subject = await this.subjectRepository.findOne({
      where: {
        id: 5,
      },
      relations: ['teachers'],
    });
    console.log(
      '🚀 ~ file: training.controller.ts:70 ~ TrainingController ~ removingRelation ~ subject:',
      subject,
    );

    subject.teachers = subject.teachers.filter((teacher) => teacher.id !== 5);
    console.log(
      '🚀 ~ file: training.controller.ts:76 ~ TrainingController ~ removingRelation ~ subject:',
      subject,
    );

    return await this.subjectRepository.save(subject);
    // await this.subjectRepository
    //   .createQueryBuilder('s')
    //   .update()
    //   .set({ name: 'Confidential' })
    //   .execute();
  }
}
