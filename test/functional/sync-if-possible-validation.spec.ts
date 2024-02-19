import { Validator } from '../../src/validation/Validator';
import { ValidationArguments } from '../../src/validation/ValidationArguments';
import { registerDecorator } from '../../src/register-decorator';
import { ValidationOptions } from '../../src/decorator/ValidationOptions';
import { ValidatorConstraint, Validate, IsNotEmpty } from '../../src/decorator/decorators';
import { ValidatorConstraintInterface } from '../../src/validation/ValidatorConstraintInterface';
import { isPromise } from 'util/types';

const validator = new Validator();

describe('conditionally validate async or sync if possible', () => {
  @ValidatorConstraint({ name: 'isShortenThan', async: true })
  class IsShortenThanConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments): Promise<boolean> {
      return Promise.resolve(false);
    }
  }

  function IsLonger(property: string, validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [property],
        async: true,
        name: 'isLonger',
        validator: {
          validate(value: any, args: ValidationArguments): Promise<boolean> {
            return Promise.resolve(false);
          },
        },
      });
    };
  }

  class FirstClass {
    @IsNotEmpty({ message: 'name should not be empty' })
    name: string;

    @IsNotEmpty()
    alwaysWithValue: string = 'this field always has a value';
  }

  class SecondClass {
    @IsLonger('lastName')
    firstName: string;

    @Validate(IsShortenThanConstraint)
    lastName: string;

    @IsNotEmpty({ message: 'name should not be empty' })
    name: string;

    @IsNotEmpty()
    alwaysWithValue: string = 'this field always has a value';
  }

  it('should return synchronously with no errors', () => {
    expect.assertions(1);
    const model = new FirstClass();
    model.name = 'Umed';
    const errors = validator.validateSyncIfPossible(model);
    expect(Array.isArray(errors) && errors.length === 0).toBeTruthy();
  });
  it('should return synchronously with an error', () => {
    expect.assertions(1);
    const model = new FirstClass();
    model.name = '';
    const errors = validator.validateSyncIfPossible(model);
    expect(Array.isArray(errors) && errors.length === 1).toBeTruthy();
  });
  it('should return promise with two errors', async () => {
    expect.assertions(2);
    const model = new SecondClass();
    model.firstName = 'such validation may lead';
    model.firstName = 'to recursion';
    model.name = 'Umed';
    const errors = validator.validateSyncIfPossible(model);
    expect(isPromise(errors)).toBeTruthy();
    expect((await errors).length).toEqual(2);
  });
  it('should return promise with three error', async () => {
    expect.assertions(2);
    const model = new SecondClass();
    model.firstName = 'such validation may lead';
    model.firstName = 'to recursion';
    model.name = '';
    const errors = validator.validateSyncIfPossible(model);
    expect(isPromise(errors)).toBeTruthy();
    expect((await errors).length).toEqual(3);
  });
});
