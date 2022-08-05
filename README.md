## Llama Pay Cli - Unofficial Version

Llama Pay CLI to interact with LlamaPay

### Guide

Copy the environmental variables. Open the .env file and add the private key to the KEY variable.
The default rpc and network points to the WUSDC subnet.

``` 
    $ cp .env.exmaple .env 
```

Install and Compile
```code
    $ npm install 
    $ npm run compile
    $ node dist/cli.js --help 
```

Available commands
```code

Usage: cli [options] [command]

Options:
  -h, --help                    display help for command

Commands:
  cancelStream [options]        cancel stream by stream ID. To get stream id, use the list command
  createLlamaPay|clp [options]  create llamaPay through llamaPayFactory providing an ERC20 token
  createStream|cs [options]     create a stream to start paying a payee
  deposit [options]             deposit the underlying token specified in the llamaPayContract to the contract. It will automatically approve the amount specified if allowance is not
                                sufficient
  getStream|gs [options]        get stream information including basic event history by stream id
  getWithdrawable|gw [options]  get the stream withdrawable amount and what is owed by stream id
  help [command]                display help for command
  list|ls [options]             list streams and historical events by payer or payee
  withdraw [options]            withdraw all tokens by stream id. this can be called by anyone
  withdrawPayerAll [options]    withdraw tokens for payer. the returning balance is the total balance subtracts the debt
```

